import type { Rolldown, UserConfig } from 'vite';
import { isCSSRequest } from 'vite';
import { getValue } from 'vp-runtime-helper';

import {
  DEP_PRE_BUNDLE_CONVERSION_NS,
  DEP_PRE_BUNDLE_EXTERNAL_PREFIX,
  ROLLDOWN_PLUGIN_NAME
} from '../common/constants';
import { logger } from '../common/logger';
import { Resolver } from '../common/Resolver';
import type { ExternalIIFE, ResolvedOptions } from '../typings';

/**
 * Rolldown plugin injected via 'optimizeDeps.rolldownOptions.plugins' into
 * the Vite 8 DepsOptimizer (dev-time pre-bundler). Replaces the legacy
 * esbuild plugin used in earlier vite-plugin-external releases.
 *
 * 注入到 Vite 8 DepsOptimizer 预打包流程的 Rolldown 插件，取代
 * vite-plugin-external 老版本里实现的 esbuild 插件。
 *
 * Why is this plugin needed?
 * 为什么需要这个插件？
 *
 *   The DepsOptimizer pre-bundles every 'optimizeDeps.include' lib plus any
 *   lib it discovers via 'registerMissingImport'. If 'react' is declared as
 *   'externals: {react:'React'}', the pre-bundler still needs to know:
 *     — "should 'import 'react'' be bundled?" → no (external or stash file).
 *     — "if bundled, what SOURCE should I bundle?" → the stash shim.
 *   Without this plugin, Rolldown would try to resolve 'react' under
 *   'node_modules/' and fail when the user removed the dep.
 *
 *   DepsOptimizer 会预打包 include 列表 + 动态发现的 missing import。
 *   当用户声明了 'externals: {react:'React'}'，预打包器仍然需要知道：
 *     - import 'react' 需要 bundle 吗？→ 不需要（external） 或 需要（打包 stash shim）
 *     - 如果 bundle，读哪个源代码？ → 读我们写的 stash 文件
 *   没有这个插件的话，Rolldown 会试图去 node_modules 找 react，结果用户没装
 *   就直接报错。
 *
 * Lifecycle（流程）：
 *   1. 'resolveId(id, importer, {isEntry})' — ask the shared 'Resolver'
 *      whether 'id' is an external. Three possible outcomes:
 *
 *      通过共享的 Resolver 询问 id 是否是 external。三种情况：
 *
 *        (a) id 命中 'DEP_PRE_BUNDLE_EXTERNAL_PREFIX' → return '{ id: <stripped>, external: true }'
 *            Second pass of the namespace re-export pattern (see 'load' below).
 *            这是 load 阶段生成 '<prefix>react' 之后进入第二轮 resolveId。
 *            剥离前缀，直接 external:true 放行。
 *
 *        (b) 'Resolver.resolve()' returns 'true' → pure external, no stash.
 *            We cannot simply emit '{ external: true }' because CSS imports
 *            and 'import * as X from 'X'' breaks in the pre-bundled output
 *            unless we preserve the module namespace shape. Instead we route
 *            resolution through the 'DEP_PRE_BUNDLE_CONVERSION_NS' namespace,
 *            which causes the subsequent 'load' to emit a re-export shim
 *            that re-imports '<prefix>id' (handled by case (a) above).
 *
 *            Resolver 返回 true → 纯 external，没有 stash 文件。
 *            不能直接 return {external:true}，因为 CSS import 和 import * as X
 *            在预打包后丢失命名空间形状会挂。所以走一个自定义命名空间，让下
 *            一轮 'load' 生成重导出 shim：shim 内部 import '<prefix>id'，然后
 *            回到 (a) 分支，那个 '<prefix>id' 被剥离前缀后标 external:true。
 *            等价于"预打包后的模块里保留了 import 'external' 的原样"，但把
 *            CJS/ESM 命名空间形状正确地传过去了。
 *
 *        (c) 'Resolver.resolve()' returns stash info (IIFE / ES format) →
 *            redirect the pre-bundler to the stash file path (info.resolvedId).
 *            No 'external: true' here — the stash file itself is a real JS
 *            file that Rolldown bundles normally.
 *
 *            Resolver 返回 stash info（ES/IIFE）→ 让预打包器直接打包 stash
 *            文件（这里不标 external:true，因为 stash 文件是真实 JS 文件）。
 *
 *   2. 'load(id, {namespace})' — only fires when the previous resolveId
 *      returned the 'DEP_PRE_BUNDLE_CONVERSION_NS' namespace tag (case b
 *      above). Generates a tiny ESM re-export shim that forwards
 *      everything through '<prefix>id', resolving via case (a) above.
 *      CSS requests get a bare 'import '<prefix>foo.css''.
 *
 *      只有当 resolveId 用自定义命名空间标记时才触发。生成小型 ESM 重导出 shim：
 *      'export { default } from '<prefix>id'; export * from '<prefix>id';'
 *      让 '<prefix>id' 触发 case (a) → 正确 external。
 *      CSS 请求简化成裸 import。
 *
 *   3. 'buildEnd()' — trace-only. Logs every external lib that actually
 *      passed through the pre-bundling stash, useful when debugging "why
 *      is react still being bundled?".
 *
 *      纯日志：输出所有已写 stash 的库名，用于调"为什么 X 还在打包"类问题。
 */
function rolldownPluginResolve(
  resolver: Resolver,
): Rolldown.Plugin {
  return {
    name: ROLLDOWN_PLUGIN_NAME,
    async resolveId(id: string, importer: string | undefined, extra?: { isEntry: boolean }) {
      // Case (a) — second-pass resolve for the external-prefix specifier.
      if (id.startsWith(DEP_PRE_BUNDLE_EXTERNAL_PREFIX)) {
        return {
          id: id.slice(DEP_PRE_BUNDLE_EXTERNAL_PREFIX.length),
          external: true
        };
      }

      const isEntry = !!extra?.isEntry;
      const info = await resolver.resolve(id, importer, isEntry);

      // Not external → let Rolldown resolve normally.
      if (!info) {
        return null;
      }

      // Case (b) — pure external. Re-route through the conversion namespace
      // so 'load' can emit a namespace-preserving re-export shim.
      if (info === true) {
        logger.trace(`Pre-bundling: '${id}' will be externalized (pure external).`);
        return {
          id,
          namespace: DEP_PRE_BUNDLE_CONVERSION_NS
        };
      }

      // Case (c) — stash-based named external / CDN external. Log the
      // categorisation then redirect to the stash path.
      if ((info as ExternalIIFE).name) {
        logger.trace('Pre-bundling IIFE external:', {
          name: (info as ExternalIIFE).name,
          id,
          importer,
          isEntry
        });
      }
      else {
        logger.trace('Pre-bundling ES external:', {
          link: info.link,
          id,
          importer,
          isEntry
        });
      }

      return {
        id: info.resolvedId
      };
    },

    // Pair for case (b). Generates the ESM re-export shim.
    // case (b) 的配对处理：生成 ESM 重导出 shim。
    load(id: string, extra?: { namespace?: string }) {
      if (extra?.namespace !== DEP_PRE_BUNDLE_CONVERSION_NS) {
        return null;
      }
      const modulePath = `"${DEP_PRE_BUNDLE_EXTERNAL_PREFIX}${id}"`;
      return {
        code: isCSSRequest(id)
          ? `import ${modulePath};`
          : `export { default } from ${modulePath};\nexport * from ${modulePath};`,
        moduleType: 'js'
      };
    },

    buildEnd() {
      logger.debug('Pre-bundling externals:', Array.from(resolver.stashMap.keys()));
    }
  };
}

/**
 * Wire the Rolldown plugin above into 'optimizeDeps.rolldownOptions.plugins'.
 * If the user already has plugins configured here, we append ourselves at
 * the END (our Resolver-based decisions should take precedence over any
 * generic plugin resolve, but if the user explicitly added a custom
 * rolldown plugin that rewrites IDs, theirs runs first).
 *
 * 把上面的 Rolldown 插件挂到 'optimizeDeps.rolldownOptions.plugins'。
 * 如果用户已有配置，我们 append 在末尾——Resolver 基于共享状态的判断优先于
 * 通用 resolve 插件，但用户显式加的自定义 Rolldown 插件先跑是合理的。
 */
export async function setOptimizeDeps(
  resolver: Resolver,
  _opts: ResolvedOptions,
  config: UserConfig,
): Promise<void> {
  const plugins = getValue<Rolldown.Plugin[]>(
    config,
    'optimizeDeps.rolldownOptions.plugins',
    [],
  );
  plugins.push(rolldownPluginResolve(resolver));
}
