import { name } from '../../package.json' with { type: 'json' };

/**
 * Public Vite plugin name, registered into 'plugin.name'.
 * 公共 Vite 插件名，写入 'plugin.name' 字段，用户在 vite logs 中看到的就是它。
 */
export const PLUGIN_NAME = name;

/**
 * Name used for the Rolldown plugin injected via 'optimizeDeps.rolldownOptions.plugins'.
 * Namespaced under the plugin name so the pre-bundle logs still attribute this plugin correctly.
 *
 * 通过 'optimizeDeps.rolldownOptions.plugins' 注入到 DepsOptimizer 的 Rolldown 插件名。
 * 用 'PLUGIN_NAME:' 前缀命名空间包裹，这样预打包日志里能明确溯源到本插件。
 */
export const ROLLDOWN_PLUGIN_NAME = `${name}:rolldown-resolve`;

/**
 * Rolldown plugin namespace used to re-export pure externals through the
 * external-prefix re-export pattern (see handleOptimizeDeps.load).
 *
 * 专门的 Rolldown 命名空间，用于处理"纯 external（没有全局名）"情况时的
 * "拆包+重导出"中间环节。具体作用见 handleOptimizeDeps.load 注释。
 */
export const DEP_PRE_BUNDLE_CONVERSION_NS = `${name}:dep-pre-bundle:external-conversion`;

/**
 * Import prefix prepended to a pure-external id so the subsequent resolveId
 * call can recognise it and emit '{ external: true }' reliably.
 *
 * 为纯 external 模块拼接的 import 前缀。load 阶段生成的代码形如
 * 'export * from '<prefix>react''；下一轮 resolveId 命中这个前缀就直接返回 external:true。
 */
export const DEP_PRE_BUNDLE_EXTERNAL_PREFIX = `${name}:dep-pre-bundle-external:`;
