import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { isPlainObject } from 'is-what-type';
import type {
  ConfigEnv,
  DevEnvironment,
  HtmlTagDescriptor,
  IndexHtmlTransformResult,
  Plugin,
  ResolvedConfig,
  UserConfig
} from 'vite';
import { getDepsCacheDir } from 'vp-runtime-helper';

import { PLUGIN_NAME } from './common/constants';
import { logger } from './common/logger';
import { Resolver } from './common/Resolver';
import type { ResolvedOptions } from './internal-types';
import { setExternals } from './lib/handleExternals';
import { setOptimizeDeps } from './lib/handleOptimizeDeps';
import { buildOptions } from './lib/handleOptions';
import type { Options } from './types';

/**
 * 清理 Vite DepsOptimizer 缓存 metadata 里本插件写入过的库条目。
 *
 * 为什么需要这段清理？
 * 用户配置 externals: {react:'React'} 时，基本意味着 node_modules 里
 * 不再装 react。但 DepsOptimizer 会把上一次预打包的依赖列表写进
 * _metadata.json。如果里面还残留 react 的 optimized 条目，可能导致：
 *   (a) Vite 试图 serve 旧缓存，但那份缓存跟新的全局 shim 不一致；
 *   (b) Vite 报"缺失依赖"，因为缓存项指向已经删掉的 node_modules 文件。
 *
 * 调用时机：configResolved 钩子中，且 externals 为 plain object 形态时调用。
 * 因为只有对象形态才能静态枚举库名；函数 / 正则形态拿不到清单。
 */
export async function cleanupCache(
  deps: string[],
  config: ResolvedConfig,
): Promise<void> {
  if (deps.length === 0) {
    return;
  }

  // SSR build 用单独的 deps cache 目录，这里按 build.ssr 取正确路径。
  const ssr = config.command === 'build' && !!config.build.ssr;
  const depsCacheDir = getDepsCacheDir(config, ssr);
  const cachedMetadataPath = join(depsCacheDir, '_metadata.json');

  let metadata: { optimized?: Record<string, unknown> };
  try {
    metadata = JSON.parse(readFileSync(cachedMetadataPath, 'utf-8'));
  }
  catch {
    // metadata 不存在、JSON 无法解析、或文件系统只读 —— 无需处理。
    return;
  }

  if (!metadata) {
    return;
  }

  const { optimized } = metadata;
  if (optimized && Object.keys(optimized).length) {
    for (const libName of deps) {
      if (optimized[libName]) {
        delete optimized[libName];
      }
    }

    try {
      writeFileSync(cachedMetadataPath, JSON.stringify(metadata));
      logger.debug('Cleanup cache metadata.');
    }
    catch {
      // 无权限 / 只读文件系统的错误忽略：清理是尽力而为，不影响主流程。
    }
  }
}

/**
 * 找出用户配置的第一个 build output 的 format（找不到则 undefined）。
 * 故意只看"第一个匹配的"，不遍历全部——因为 interop 判断是粗粒度：
 * "至少有一个 IIFE 输出？"这对于历史 heuristic 已经够用了。
 */
function getOutputFormat(config: UserConfig): string | undefined {
  const output = config.build?.rolldownOptions?.output;
  if (!output) {
    return undefined;
  }
  if (Array.isArray(output)) {
    return output.find((o: any) => o?.format === 'iife')?.format;
  }
  return (output as any)?.format;
}

/**
 * 合并后的 Vite 8 单一实现。
 *
 * 历史上此插件有两条并行路线：
 *   • rollback=false（后期方案）—— alias + 构建时 rolldownOptions.external
 *   • rollback=true （早期方案）——运行时 alias 重定向（最原始实现）
 * Vite 8 中我们把 dev 和 build 统一到 depsOptimizer + resolveId 这一条路线
 * （后期方案），彻底移除 alias 分支。
 *
 * 钩子与阶段：
 *  - config           — 1. 生成最终版 opts（默认值 + 模式 override）
 *                       2. 实例化 Resolver —— 它持有 stashMap 和 externals hooks
 *                       3. 往 optimizeDeps.rolldownOptions.plugins 注入预打包插件
 *                       4. 构建 external hook，同时挂到 rolldownOptions.external
 *                          和 Resolver.useHook，让三处入口共享同一份判断
 *                       5. 若声明了 interop: 'auto' 或输出格式不是 IIFE，
 *                          清空 rolldownOptions.external，强制走 stash 解析路线
 *
 *  - configResolved   — 日志输出合并后的 rolldownOptions；对对象形态的
 *                       externals 调用 cleanupCache 清理历史 metadata。
 *
 *  - resolveId        — 插件的路由核心。
 *                         · build 模式：ES 外部 → CDN 链接 external:true；
 *                           IIFE 外部 → stash 文件路径。
 *                         · dev 模式：通过 DepsOptimizer.registerMissingImport
 *                           + getOptimizedDepId 把 stash 文件包成"已优化依赖"
 *                           来 serve（速度快、source map、HMR 友好）。
 *                           没有 DepsOptimizer 时（SSR / tests）直接返回
 *                           stash 路径兜底。
 *
 *  - transformIndexHtml — 每个 ES 格式 external（CDN URL）都注入一条
 *                         <link rel="modulepreload">，浏览器首屏就开始预取 CDN 模块。
 *
 * 保留 interop: 'auto' 的历史行为：在声明它（或非 IIFE 输出）时，清空
 * build.rolldownOptions.external，强制所有 external 通过 stash 解析路线，
 * 用于 IIFE build 边界场景的兼容。
 */
export default function v8(opts: Options): Plugin {
  let resolvedOptions: ResolvedOptions;
  let resolver: Resolver;

  return {
    name: PLUGIN_NAME,
    enforce: 'pre',
    async config(config: UserConfig, env: ConfigEnv) {
      resolvedOptions = buildOptions(opts, env);
      resolver = new Resolver(resolvedOptions.cacheDir);

      // 往 dev DepsOptimizer 注入 Rolldown 插件。
      // build 阶段完全不触发，注册成本几乎为零。
      await setOptimizeDeps(resolver, resolvedOptions, config);

      // 构建共享的 external 判断 hook，然后同时挂载到两个消费者：
      //   1. build.rolldownOptions.external — Rolldown build 阶段原生入口
      //   2. Resolver.useHook              — dev + build 主 resolveId 入口
      // 这样保证三处入口（DepsOptimizer 预打包、主 resolveId、Rolldown build）
      // 的判断结果 100% 一致。
      resolver.useHook(setExternals(resolvedOptions, config));

      // 历史遗留 interop + 非 IIFE build 时清 external：
      //   - interop: 'auto' 意味着用户明确想走"全部当 stash 文件打包"路线。
      //   - 输出格式不是 iife 时，Rolldown 原生 output.globals 本来不生效，
      //     清空原生 external 强制所有 external 走 stash 文件路线，
      //     产物对 ESM/CJS 构建的形状更正确。
      if (opts.interop === 'auto' || getOutputFormat(config) !== 'iife') {
        const buildCfg = config.build!;
        const rolldownCfg = buildCfg.rolldownOptions || {};
        rolldownCfg.external = undefined;
        buildCfg.rolldownOptions = rolldownCfg;
      }
    },

    configResolved(config) {
      logger.debug('Resolved rolldownOptions:', config.build.rolldownOptions);

      // 对对象形态的 externals 清理 DepsOptimizer metadata 里的旧条目。
      const { externals } = resolvedOptions;
      if (isPlainObject(externals)) {
        cleanupCache(Object.keys(externals), config);
      }
    },

    async resolveId(id, importer, extra) {
      const info = await resolver.resolve(id, importer, !!extra?.isEntry);

      if (!info) {
        logger.trace(`'${id}' is not external.`);
        return;
      }

      if (info === true) {
        logger.debug(`'${id}' is externalized.`);
        return { id, external: true };
      }

      // info === true 时前面已 return，此处 info 一定是 ExternalIIFE | ExternalES 形态。
      const env = (this as any).environment as DevEnvironment | undefined;

      // 判断当前阶段：build 阶段可能 environment.mode==='build'，
      // 也可能干脆没有 environment；兜底用之前 ConfigEnv 记录的 command。
      const mode = env?.mode ?? (resolvedOptions.command === 'build' ? 'build' : 'dev');

      if (mode === 'build') {
        // ES CDN 链接 → 直接 external:true，产物保留裸 import。
        if (info.format === 'es') {
          logger.debug(`'${id}' is resolved to '${info.cdnUrl}'.`);
          return { id: info.cdnUrl, external: true };
        }

        // IIFE 全局变量 → 解析到 stash 文件路径。Rolldown 把一行 CJS shim
        // 当作普通模块打包进去。
        logger.debug(`'${id}' is resolved to '${info.stashPath}'.`);
        return info.stashPath;
      }

      // dev 阶段。
      const depsOptimizer = env?.depsOptimizer;
      if (!depsOptimizer) {
        // 兜底：没有 DepsOptimizer（SSR / 测试环境）时直接返回 stash 路径。
        return info.stashPath;
      }

      // 把 stash 文件包成"新发现的依赖"。Vite 后续把它当成普通优化依赖：
      // 写入 deps cache 目录、仅在 stash 内容变更时重预打包、用 ESM interop
      // 头返回，保证 'import React from 'react'' 仍能拿到 default。
      const depInfo = depsOptimizer.registerMissingImport(id, info.stashPath);
      const depId = depsOptimizer.getOptimizedDepId(depInfo);

      logger.debug(`'${id}' is resolved to ${depId}`);
      return depId;
    },

    transformIndexHtml(html: string): IndexHtmlTransformResult | undefined {
      if (!resolver) {
        return;
      }
      // 只有 ES CDN 格式 external 需要 modulepreload（从远端 CDN 拉取）。
      // IIFE 全局变量由 stash shim 就地提供，不涉及网络请求。
      const { stashMap } = resolver;
      const tags: HtmlTagDescriptor[] = [];
      stashMap.forEach((info) => {
        if (info.format === 'es') {
          tags.push({
            tag: 'link',
            attrs: {
              rel: 'modulepreload',
              href: info.cdnUrl
            },
            injectTo: 'head'
          });
        }
      });
      if (tags.length > 0) {
        return { html, tags };
      }
    }
  };
}

export * from './types';
