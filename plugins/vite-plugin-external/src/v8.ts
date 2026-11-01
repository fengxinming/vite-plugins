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
 * 调用时机：configResolved 钩子。清理名单由 v8() 组装：
 * 插件自建 metadata（Resolver 在每次 stash 后 300ms 防抖落盘的
 * externalized 清单，覆盖函数 / 正则等拿不到静态清单的形态）
 * ∪ externals 为 plain object 形态时的对象 key。
 */
export async function cleanupCache(
  deps: string[],
  config: ResolvedConfig,
): Promise<void> {
  if (deps.length === 0) {
    return;
  }

  // SSR build 用单独的 deps cache 目录，这里按 build.ssr 取正确路径。
  const ssr = config.command === 'build' && !!config.build?.ssr;
  const depsCacheDir = getDepsCacheDir(config, ssr);
  const cachedMetadataPath = join(depsCacheDir, '_metadata.json');

  let metadata: { optimized?: Record<string, unknown> };
  try {
    metadata = JSON.parse(readFileSync(cachedMetadataPath, 'utf-8'));
  }
  catch (err) {
    // deps metadata 还不存在（从未预打包过）是正常状态，按无需清理降级；
    // 其余失败（JSON 坏 / 只读文件系统）才是真异常，留日志可查。
    if ((err as { code?: string }).code === 'ENOENT') {
      logger.trace('Deps metadata does not exist yet, nothing to clean.');
    }
    else {
      logger.warn('Failed to read deps metadata:', err);
    }
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
    catch (err) {
      // 无权限 / 只读文件系统：清理是尽力而为，不影响主流程，但要留日志可查。
      logger.warn('Failed to write deps metadata:', err);
    }
  }
}

function isGlobalsFormat(format: string | undefined): boolean {
  return format === 'iife' || format === 'umd';
}

/**
 * 判定最终产物格式里是否含 globals 生效格式（iife/umd）。
 * 镜像 Vite resolveBuildOutputs（8.2.2 chunks/node.js:33878-33897）对
 * output 与 lib.formats 的胜负规则：
 *   · lib 生效且 output 非数组 → 产物 format 完全由 libFormats 决定
 *     （formats 缺省：单入口 ['es','umd']、多入口 ['es','cjs']），
 *     单 output 对象只提供模板字段，其 format 被 libFormats.map 覆盖；
 *   · output 是数组 → lib.formats 整个被忽略（vite warn），只看数组各项的 format；
 *   · 无 lib → output 原样生效。
 * 认 iife/umd 两种：rolldown output.globals 的官方描述逐字为
 * "Global variable of UMD / IIFE dependencies"
 * （create-bundler-option-Cj0juyCQ.mjs:1793/1836），二者同受 globals 映射；
 * 其余格式（es/cjs/amd/system）走 stash 解析路线。
 */
function isGlobalsOutputFormat(build: NonNullable<UserConfig['build']>): boolean {
  const { output } = build.rolldownOptions ?? {};
  if (Array.isArray(output)) {
    return output.some((o) => isGlobalsFormat(o.format));
  }
  if (build.lib) {
    const { entry, formats } = build.lib;
    const hasMultipleEntries = typeof entry !== 'string' && !!entry && Object.values(entry).length > 1;
    return (formats ?? (hasMultipleEntries ? ['es', 'cjs'] : ['es', 'umd'])).some(isGlobalsFormat);
  }
  return isGlobalsFormat(output?.format);
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
 *                       5. 若最终输出格式含 iife/umd（含 build.lib.formats 产生的
 *                          iife/umd，判定镜像 vite resolveBuildOutputs 胜负树；
 *                          且未声明 interop:'auto'），
 *                          保留原生 rolldownOptions.external + output.globals；
 *                          否则清空原生 external，强制走 stash 解析路线
 *
 *  - configResolved   — 仅 dev：用「上次名单 ∪ 本次静态名单」调 cleanupCache，把 Vite
 *                       deps 缓存里属于 external 的条目删掉，迫使它重新预构建。
 *                       build 不走 DepsOptimizer，这里直接跳过。
 *
 *  - closeServer      — 仅 reason === 'restart'：dev 改配置重启后插件实例被重建、
 *                       stashMap 清空，而 DepsOptimizer 不会重跑，此时恢复 metadata
 *                       里的条目，让 transformIndexHtml 仍能注入 CDN modulepreload。
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
 * 保留 interop: 'auto' 的历史行为：声明它时清空 build.rolldownOptions.external，
 * 强制所有 external 通过 stash 解析路线。仅当输出格式为 iife/umd 且未声明
 * interop:'auto' 时，才保留原生 external + output.globals（globals 只在
 * iife/umd 下生效，es/cjs 下无意义）。
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

      resolver.useHook(setExternals(resolvedOptions, config));

      // globals 门控：iife/umd（含 lib.formats 产生的）保留原生 external + output.globals，
      // 其余格式清掉原生 external 走 stash 解析路线。判定见 isGlobalsOutputFormat。
      if (opts.interop === 'auto' || !isGlobalsOutputFormat(config.build ?? {})) {
        const rolldownOptions = config.build?.rolldownOptions;
        if (rolldownOptions) {
          rolldownOptions.external = undefined;
        }
      }
    },

    configResolved(config) {
      logger.debug('[configResolved] Resolved rolldownOptions:', config.build.rolldownOptions);

      /*
       * 清理 Vite deps 缓存里的旧条目 —— 仅 dev
       * Clear stale Vite deps entries — dev only
       *
       * 为什么只认 serve：build 不走 DepsOptimizer，deps 缓存与产物无关，此时去读写
       * .vite/deps/_metadata.json 纯属副作用。build 的 external 完全由
       * resolveId + rolldown external + output.globals 决定。
       * Dev only: build never runs DepsOptimizer, and its externals are fully decided by
       * resolveId + rolldown external + output.globals.
       *
       * 名单 = 上次名单 ∪ 本次静态名单：
       *   1. 自建 metadata 的 keys —— 上次运行被 external 过、Vite 缓存里可能还留着条目的模块；
       *   2. externals 为 plain object 时本次配置的 keys —— 补上"本次新增"的模块，
       *      它们在上一份名单里并不存在，只能当场算。
       * 函数形态算不出静态名单，新增项要等下一次启动才进入名单被清理。
       * The union covers newly added modules; a function-form `externals` cannot be
       * enumerated, so additions are only cleaned on the next start.
       */
      if (config.command === 'serve') {
        const { externals } = resolvedOptions;
        const deps = Object.keys(resolver.loadMetadata());
        if (isPlainObject(externals)) {
          deps.push(...Object.keys(externals));
        }
        cleanupCache(deps, config);
      }
    },

    /*
     * closeServer 钩子 — dev 因改配置重启时，恢复 stash 状态
     * closeServer hook — Restores stash state when dev restarts after a config edit
     *
     * 为什么需要：改 vite.config 会让 Vite 重建插件实例（stashMap 为空），但
     * DepsOptimizer 判定缓存仍有效、不会重新预构建。不恢复的话，之前 stash 过的
     * ES external 就丢了 format / cdnUrl，transformIndexHtml 注入不出 CDN 的
     * modulepreload。
     * 只在 reason === 'restart' 时恢复：正常关闭没有"下一轮"，恢复毫无意义。
     * Only restores on restart — a normal shutdown has no next round.
     */
    closeServer(server) {
      if (server.reason === 'restart') {
        resolver.restoreMetadata();
      }
    },

    async resolveId(id, importer, options) {
      const info = await resolver.resolve(id, importer, options);

      if (!info) {
        logger.trace(`[resolveId] '${id}' is not external.`);
        return;
      }

      if (info === true) {
        logger.debug(`[resolveId] '${id}' is externalized.`);
        return { id, external: true };
      }

      // info === true 时前面已 return，此处 info 一定是 ExternalIIFE | ExternalES 形态。
      const env = this.environment;

      // 判断当前阶段：build 阶段可能 environment.mode==='build'，
      // 也可能干脆没有 environment；兜底用之前 ConfigEnv 记录的 command。
      const mode = env.mode ?? resolvedOptions.command;

      if (mode === 'build') {
        // ES CDN 链接 → 直接 external:true，产物保留裸 import。
        if (info.format === 'es') {
          logger.debug(`[resolveId] '${id}' => CDN: '${info.cdnUrl}'.`);
          return { id: info.cdnUrl, external: true };
        }

        // IIFE 全局变量 → 解析到 stash 文件路径。Rolldown 把一行 CJS shim
        // 当作普通模块打包进去。
        logger.debug(`[resolveId] '${id}' => Path: '${info.stashPath}'.`);
        return info.stashPath;
      }

      // dev 阶段。
      const depsOptimizer = (env as unknown as DevEnvironment).depsOptimizer;
      if (!depsOptimizer) {
        // 兜底：没有 DepsOptimizer（SSR / 测试环境）时直接返回 stash 路径。
        return info.stashPath;
      }

      // 把 stash 文件包成"新发现的依赖"。Vite 后续把它当成普通优化依赖：
      // 写入 deps cache 目录、仅在 stash 内容变更时重预打包、用 ESM interop
      // 头返回，保证 'import React from 'react'' 仍能拿到 default。
      const depInfo = depsOptimizer.registerMissingImport(id, info.stashPath);
      const depId = depsOptimizer.getOptimizedDepId(depInfo);

      logger.debug(`[resolveId] '${id}' => OptimizedDepId: '${depId}'`);
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
