import { name } from '../../package.json' with { type: 'json' };

/**
 * 对外暴露的 Vite 插件名，写入 plugin.name 字段，用户在 vite 日志中看到的就是它。
 */
export const PLUGIN_NAME = name;

/**
 * 通过 optimizeDeps.rolldownOptions.plugins 注入到 DepsOptimizer 的 Rolldown 插件名。
 * 使用 PLUGIN_NAME 作为命名空间前缀，预打包日志中能明确溯源到本插件。
 */
export const ROLLDOWN_PLUGIN_NAME = `${name}:rolldown-resolve`;

/**
 * 预打包阶段的 Rolldown 命名空间，处理纯 external（无全局名映射）情况时的"拆包+重导出"中间环节。
 * 具体作用见 handleOptimizeDeps.load 中的注释。
 */
export const DEP_PRE_BUNDLE_CONVERSION_NS = `${name}:dep-pre-bundle:external-conversion`;

/**
 * 为纯 external 模块拼接的 import 前缀。load 阶段生成的代码形如
 * 'export * from '<prefix>react''；下一轮 resolveId 命中这个前缀后会直接返回 external:true。
 */
export const DEP_PRE_BUNDLE_EXTERNAL_PREFIX = `${name}:dep-pre-bundle-external:`;
