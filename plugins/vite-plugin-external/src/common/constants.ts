import pkg from '../../package.json' with { type: 'json' };

/**
 * 对外暴露的 Vite 插件名，写入 plugin.name 字段，用户在 vite 日志中看到的就是它。
 */
export const PLUGIN_NAME = pkg.name;

export const PLUGIN_CONFIG_NAME = `${PLUGIN_NAME}:config`;

/**
 * 通过 optimizeDeps.rolldownOptions.plugins 注入到 DepsOptimizer 的 Rolldown 插件名。
 * 使用 PLUGIN_NAME 作为命名空间前缀，预打包日志中能明确溯源到本插件。
 *
 * 注入的插件按"一个 id 维度 = 一个插件 = 一个 resolveId = 一个 filter 正则"拆开
 * （对齐 vite 自己的 vite:dep-pre-bundle-assets / vite:dep-pre-bundle 拆分）：
 * 各插件的 filter 互不重叠，判定逻辑却共用同一个 Resolver，既不会让某个维度
 * 的正则退化，也不会让三个维度各自复制一份下发代码。
 */
export const ROLLDOWN_PLUGIN_NAME = `${PLUGIN_NAME}:rolldown-resolve`;

/** 入口维度：vite 把 optimizeDeps.include 解析成绝对路径后作为 rolldown 的 input。 */
export const ROLLDOWN_PLUGIN_ENTRY_NAME = `${ROLLDOWN_PLUGIN_NAME}:entry`;

/** 资源后缀维度：css / png / wasm 这类可能是相对路径的 id。 */
export const ROLLDOWN_PLUGIN_ASSET_NAME = `${ROLLDOWN_PLUGIN_NAME}:asset`;

/** 生命周期维度：buildEnd 记一条本轮 external 名单的日志，并把待落盘的写兜底 flush 掉；不参与判定。 */
export const ROLLDOWN_PLUGIN_METADATA_NAME = `${ROLLDOWN_PLUGIN_NAME}:metadata`;

/**
 * `Resolver.scheduleFlushMetadata` 的防抖窗口（毫秒）。
 *
 * 一轮并发 resolve 会给多个库各调一次 stash，窗口内只落一次盘；
 * 500ms 足够覆盖一次页面首屏的模块解析，又不至于把名单压到请求链尾巴之后才可见。
 */
export const METADATA_FLUSH_DEBOUNCE_MS = 500;

/**
 * 协议插件名：负责纯 external 的两段式转换（CONVERSION → load 生成 shim →
 * EXTERNAL 前缀 → external），不参与"是不是 external"的判定。
 */
export const ROLLDOWN_CONVERSION_PLUGIN_NAME = `${PLUGIN_NAME}:rolldown-conversion`;
