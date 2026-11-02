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
 * 预打包阶段"转入模块"的 id 前缀，load 靠它判断当前模块是自己的转换产物。
 * 对应 handleOptimizeDeps 中的纯 external 转路由（case b → case a）。
 *
 * 为什么用 id 前缀而不是 resolveId 的 namespace 字段：
 *   rolldown 的 load 钩子只传 id（实测 argc=1，moduleInfo.meta 为空），
 *   namespace 字段既不会传给 load，也无法从 moduleInfo.meta 读到；
 *   vite 自身的约定也是把命名空间编码进 id 前缀（内部 idToPathAndNamespace
 *   按第一个冒号切分）。
 *
 * 为什么前缀里刻意不含冒号：
 *   vite 的 idToPathAndNamespace 按第一个冒号切分 id，含冒号的前缀会被解析成
 *   名不副实的 namespace + 残缺 path；不含冒号时该函数原样返回整个 id，不会误伤。
 */
export const DEP_PRE_BUNDLE_CONVERSION_PREFIX = `\0${name}-dep-conversion-`;

/**
 * 为纯 external 模块拼接的 import 前缀。load 阶段生成的代码形如
 * 'export * from '<prefix>react''；下一轮 resolveId 命中这个前缀后会直接返回 external:true。
 */
export const DEP_PRE_BUNDLE_EXTERNAL_PREFIX = `${name}:dep-pre-bundle-external:`;
