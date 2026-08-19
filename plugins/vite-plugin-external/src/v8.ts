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
import { setExternals } from './lib/handleExternals';
import { setOptimizeDeps } from './lib/handleOptimizeDeps';
import { buildOptions } from './lib/handleOptions';
import type { Options, ResolvedOptions } from './typings';

/**
 * Remove stale per-lib entries from Vite's DepsOptimizer metadata file.
 *
 * 清理 Vite DepsOptimizer 缓存 metadata 里本插件写入过的库条目。
 *
 * Why does this exist?
 *   When the user declares 'externals: { react: 'React' }' they almost
 *   certainly removed 'react' from 'node_modules'. Vite's DepsOptimizer,
 *   however, keeps an on-disk metadata file ('_metadata.json') that lists
 *   the last pre-bundled optimised deps + their hashes. If 'react' is
 *   still listed there, Vite could: (a) attempt to serve the old cached
 *   bundle of react that no longer matches the declared global, or
 *   (b) fall over with a "missing dep" error because the cache entry
 *   points to a node_modules file that's gone.
 *
 * 为什么需要这段清理？
 *   用户配置 'externals: {react:'React'}' 时，基本意味着 node_modules 里
 *   不再装 react。但是 DepsOptimizer 会把上一次预打包的依赖列表写进
 *   '_metadata.json'。如果里面还残留 react 的 optimized 条目，可能导致：
 *     (a) Vite 试图 serve 旧缓存，但那份缓存跟新的全局 shim 不一致；
 *     (b) Vite 报"缺失依赖"，因为缓存项指向已经删掉的 node_modules 文件。
 *
 * Called from 'configResolved' whenever 'externals' is a plain object
 * (because that's the only shape that lets us enumerate library names —
 * functions/RegExps cannot be listed statically).
 *
 * 调用时机：'configResolved' 里且 externals 为 plain object 形态时调用。
 * 因为只有对象形态才能静态枚举库名；函数 / 正则形态拿不到清单。
 */
export async function cleanupCache(
  deps: string[],
  config: ResolvedConfig,
): Promise<void> {
  if (deps.length === 0) {
    return;
  }

  // SSR build uses a separate deps cache directory; use the correct one.
  // SSR build 用单独的 deps cache 目录，这里按 build.ssr 取正确的路径。
  const ssr = config.command === 'build' && !!config.build.ssr;
  const depsCacheDir = getDepsCacheDir(config, ssr);
  const cachedMetadataPath = join(depsCacheDir, '_metadata.json');

  let metadata: { optimized?: Record<string, unknown> };
  try {
    metadata = JSON.parse(readFileSync(cachedMetadataPath, 'utf-8'));
  }
  catch {
    // Missing metadata, unparseable JSON, or read-only fs — nothing to do.
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
      // Permission- or read-only-filesystem errors are ignored here:
      // cleanup is best-effort, not critical.
      // 无权限 / 只读文件系统的错误忽略：清理是尽力而为，不影响主流程。
    }
  }
}

/**
 * Return the 'format' of the FIRST Rolldown output entry we can find, or
 * undefined when none is set. Intentionally does NOT consider every output
 * entry — the interop-clearance check below is per-build-coarse: "is at
 * least one output an IIFE?" is enough for the legacy heuristic.
 *
 * 找出用户配置的第一个 build output 的 format（找不到则 undefined）。
 * 故意只看"第一个匹配的"不看全部，因为 interop 判断是粗粒度："至少有一个
 * IIFE 输出？"——这对于历史 heuristic 已经够用了。
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
 * Unified Vite 8 implementation of vite-plugin-external.
 *
 * 合并后的 Vite 8 单一实现。
 *
 * Previously there were TWO parallel routes through this plugin:
 *   • 'rollback === false' (newer) — alias + build rolldownOptions.external
 *   • 'rollback === true'  (older) — runtime alias-based redirect（早期 alias 方案）
 * In Vite 8 we UNIFY the whole flow on the later depsOptimizer + resolveId
 * route for both dev AND build. The "alias" legacy implementation is gone.
 *
 * 历史上此插件有两条并行实现路线：
 *   • rollback=false（后期方案）——alias + 构建时 rolldownOptions.external
 *   • rollback=true （早期方案）——运行时 alias 重定向（最原始实现）
 * Vite 8 中我们把 dev 和 build 都统一到"depsOptimizer + resolveId"这一条路线
 * （后期方案），删除 alias 分支。
 *
 * Hooks / phases：
 * 钩子与阶段：
 *  - 'config'           — (1) build options with defaults + mode overrides,
 *                            生成最终版 opts（默认值 + 模式 override）
 *                         (2) instantiate Resolver (owns stash files + hook list),
 *                            实例化 Resolver —— 它持有 stashMap 和 externals hooks
 *                         (3) inject Rolldown plugin for DepsOptimizer pre-bundling,
 *                            往 optimizeDeps.rolldownOptions.plugins 注入预打包插件
 *                         (4) build & wire the external hook to BOTH
 *                             rolldownOptions.external AND Resolver.useHook,
 *                             构建 external hook，同时挂到 rolldownOptions.external
 *                             和 Resolver.useHook，让三处入口共享同一份判断
 *                         (5) clear 'rolldownOptions.external' if the legacy
 *                             'interop: 'auto'' OR output format is NOT iife.
 *                             如果声明了 interop: 'auto' 或输出不是 IIFE，
 *                             清空 build 原生 external，强制走 stash 解析路线
 *
 *  - 'configResolved'   — debug log the merged rolldownOptions; call
 *                         'cleanupCache' for Record-form externals.
 *                         日志输出合并后的 rolldownOptions；对对象形态的
 *                         externals 调用 cleanupCache 清理历史 metadata。
 *
 *  - 'resolveId'        — the routing heart of the plugin.
 *                            — Build mode: ES format externals resolve straight
 *                              to the CDN link (external:true); IIFE-format
 *                              externals resolve to the stash file path.
 *                              build 模式：ES 外部 → CDN 链接 external:true；
 *                              IIFE 外部 → stash 文件路径。
 *                            — Dev mode: wrap the stash file through
 *                              'DepsOptimizer.registerMissingImport' +
 *                              'getOptimizedDepId' so Vite treats it as an
 *                              optimised dependency (fast serve, source map
 *                              preserved, hot-reload friendly). Fallback to
 *                              stash path if there is no DepsOptimizer (SSR/test).
 *                              dev 模式：通过 DepsOptimizer.registerMissingImport
 *                              + getOptimizedDepId 把 stash 文件包成"已优化依赖"
 *                              来 serve（速度快、source map、HMR 友好）。
 *                              没有 DepsOptimizer 时（SSR / tests）直接返回
 *                              stash 路径兜底。
 *
 *  - 'transformIndexHtml' — inject '<link rel="modulepreload">' tag for every
 *                           ES-format external, so browsers prefetch the CDN
 *                           ESM module right on first paint.
 *                           每个 ES 格式 external（CDN URL）都注入一条
 *                           '<link rel="modulepreload">'，浏览器首屏就开始
 *                           预取 CDN 模块。
 *
 * 'interop: 'auto'' preserves historical behaviour cleared
 * 'rollupOptions.external' for non-IIFE builds.
 *
 * 保留 'interop: 'auto'' 的历史行为：在声明它（或非 IIFE 输出）时，清空
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

      // Inject the Rolldown plugin used by the dev-time DepsOptimizer.
      // Cheap to register — it's just a no-op during build.
      // 往 dev DepsOptimizer 注入 Rolldown 插件。
      // build 阶段完全不触发，注册成本几乎为零。
      await setOptimizeDeps(resolver, resolvedOptions, config);

      // Build the shared external hook, then wire it to TWO consumers:
      // 1. 'rolldownOptions.external' (build phase).
      // 2. 'Resolver.useHook'  → dev resolveId + build resolveId.
      // 构建共享的 external 判断 hook，然后同时挂载到两个消费者：
      //   1. build.rolldownOptions.external（Rolldown build 阶段原生入口）
      //   2. Resolver.useHook                  → dev + build 主 resolveId 入口
      // 这样保证三处入口（DepsOptimizer 预打包、主 resolveId、Rolldown build）
      // 的判断结果 100% 一致。
      resolver.useHook(setExternals(resolvedOptions, config));

      // Legacy interop / non-IIFE-build clearance:
      // 历史遗留 interop + 非 IIFE build 时清 external：
      //   - 'interop: 'auto'' 意味着用户明确想走"全部当 stash 文件打包"路线。
      //   - Output format is NOT 'iife' means Rolldown native output.globals
      //     has no effect anyway, so clearing the native external flag forces
      //     every external through the stash-file route which produces
      //     correct shapes for ESM/CJS builds.
      if (opts.interop === 'auto' || getOutputFormat(config) !== 'iife') {
        const buildCfg = config.build!;
        const rolldownCfg = buildCfg.rolldownOptions || {};
        rolldownCfg.external = undefined;
        buildCfg.rolldownOptions = rolldownCfg;
      }
    },

    configResolved(config) {
      logger.debug('Resolved rolldownOptions:', config.build.rolldownOptions);

      // cleanup stale cache metadata for named externals declared as records.
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

      const { resolvedId, link } = info;
      const env = (this as any).environment as DevEnvironment | undefined;

      // Decide which phase we're in: 'build' means the Rolldown build hook
      // has 'this.environment' undefined OR 'environment.mode === 'build''.
      // Fall back to comparing the ConfigEnv.command recorded earlier.
      // 判断当前阶段：build 阶段有两种可能（environment.mode==='build'，或
      // 干脆没有 environment），回退到之前 ConfigEnv 记录的 command。
      const mode = env?.mode ?? (resolvedOptions.command === 'build' ? 'build' : 'dev');

      if (mode === 'build') {
        // ES format CDN external → resolve straight to the CDN URL; mark
        // external:true so Rolldown emits the bare import instead of bundling.
        // ES CDN 链接 → 直接 external:true，产物保留裸 import。
        if (info.format === 'es') {
          logger.debug(`'${id}' is resolved to '${link}'.`);
          return { id: link!, external: true };
        }

        // IIFE format → redirect to the stash file. Rolldown bundles the
        // 1-line CJS shim as a regular module.
        // IIFE 全局变量 → 解析到 stash 文件路径。Rolldown 把一行 CJS shim
        // 当作普通模块打包进去。
        logger.debug(`'${id}' is resolved to '${resolvedId}'.`);
        return resolvedId;
      }

      // Dev phase.
      // dev 阶段。
      const depsOptimizer = env?.depsOptimizer;
      if (!depsOptimizer) {
        // Fallback: no DepsOptimizer (SSR/test env). Return stash path directly.
        // 兜底：没有 DepsOptimizer（SSR / 测试环境）时直接返回 stash 路径。
        return resolvedId;
      }

      // Wrap the stash file as a "missing dep". Vite then treats it like
      // any other optimised dependency: caches it in the deps cache dir,
      // re-pre-bundles only when the stash content changes, serves it with
      // ESM interop headers.
      // 把 stash 文件包成"新发现的依赖"。Vite 后续把它当成普通优化依赖：
      // 写入 deps cache 目录、仅在 stash 内容变更时重预打包、用 ESM interop
      // 头返回，保证 'import React from 'react'' 仍能拿到 default。
      const depInfo = depsOptimizer.registerMissingImport(id, resolvedId);
      const depId = depsOptimizer.getOptimizedDepId(depInfo);

      logger.debug(`'${id}' is resolved to ${depId}`);
      return depId;
    },

    transformIndexHtml(html: string): IndexHtmlTransformResult | undefined {
      if (!resolver) {
        return;
      }
      // Only ES-format externals benefit from modulepreload (they are served
      // from a remote CDN). IIFE globals served inline via stash shim, no
      // network request involved.
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
              href: info.link
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

export * from './typings';
