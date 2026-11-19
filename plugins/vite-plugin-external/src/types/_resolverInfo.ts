import type { ExternalEsExports } from './deps';

/**
 * IIFE 全局变量形态的 stash 条目（如 {react:'React'}）。
 *
 * 字段说明：
 *   - format    ：标记为 iife，与 ES 格式区分（discriminated union tag）
 *   - moduleId  ：裸 import 名称（如 'react'、'react-dom/client'），用于日志、metadata 清理
 *   - stashPath ：stash 文件的绝对磁盘路径（写 CJS shim 的那个文件），作为 resolve 返回的目标
 *   - globalName：全局变量名（如 'React'），用于日志；output.globals 的映射由
 *      handleExternals 另行维护的 globalObject 表提供，不读这个字段。
 *
 * 为什么需要 stash 文件（而不是直接标 external）？
 *   1. Dev：DepsOptimizer 预打包时必须有真实文件才能扫描；
 *   2. Build（非 IIFE 输出）：纯 external 会残留裸 import "react"，
 *      而 stash 文件让 Rolldown 能打包进一个正确的 CJS/ESM shim；
 *   3. IIFE 输出：stash 的 CJS shim（module.exports = <globalName>）让 Rolldown
 *      把全局变量当作普通依赖打包；output.globals 的映射仍来自 globalObject 表。
 */
export interface ExternalIIFE {
  format: 'iife';
  moduleId: string;
  stashPath: string;
  globalName: string;
}

/**
 * ES 链接形态的 stash 条目（如 {react:'https://esm.sh/react@19.3.1'}）。
 *
 * 字段说明：
 *   - format    ：标记为 es，与 IIFE 格式区分（discriminated union tag）
 *   - moduleId  ：裸 import 名称（如 'react'）
 *   - stashPath ：stash 文件的绝对磁盘路径（写 ESM 重导出 shim 的那个文件）
 *   - url       ：ES 链接（有效绝对 URL，或以 /、./、../ 开头的有效 URL 字符串）。
 *                 stash 文件内容从这里重导出；./ ../ 在写入时已按 cwd 解析并换算成
 *                 相对 stash 目录的说明符，字段本身保留用户声明值。
 *                 transformIndexHtml 遍历 stashMap 时根据 url 注入
 *                 <link rel="modulepreload">，让浏览器首屏就预取该模块。
 *
 * 与 IIFE 的差异：stash 文件内容改为从链接重导出（export * from <url>），
 * 浏览器自身去加载那个 URL 的 ESM 模块，而不是读 window 上的全局变量。
 */
export interface ExternalES {
  format: 'es';
  moduleId: string;
  stashPath: string;
  url: string;
  exports: ExternalEsExports;
}

/**
 * 插件自建 metadata（`${cacheDir}/_metadata.json`）的文件格式。
 *
 * externalized：模块名 → stash 条目的映射，与内存里的 stashMap 同构。
 *
 * 它是一份**给下一次 dev 启动用的名单**，不参与 external 判定：
 *   - 写：只有 stash() 产出新条目时排程（Resolver.scheduleFlushMetadata），所以落盘的快照必然非空；
 *     预构建插件的 buildEnd 只把还没到期的那一次提前 flush（兜底），没排程时不写任何字节。
 *     本轮一个条目都没有时文件不更新，
 *     上一轮遗留的名字会被下一次启动继续剪，直到某轮重新 stash 才被整份快照覆盖掉。
 *     build 的 interop 路线也走 stash，因此 build 同样可能落这份线索文件。
 *   - 读（只取 keys）：configResolved 且 command === 'serve' —— 拿这批模块名去清
 *     Vite 自己的 deps 缓存条目，迫使它重新预构建。
 * 条目里的 format / url / globalName 目前没有读取方：写入就是 Object.fromEntries(stashMap)
 * 的整份快照，不做裁剪；曾消费它们的 closeServer(restart) 恢复流程已随 restoreMetadata 移除。
 *
 * 为什么是 Record 而不是数组：stashMap 本来就是 Map<string, 条目>，
 *   写成 { 模块名: 条目 } 可以直接 Object.entries / Object.fromEntries 双向搬运，
 *   读取时也能按模块名直查，不需要遍历。
 * Why a Record rather than an array: stashMap is a Map<string, entry>; keying by
 * module name makes the round-trip a direct Object.entries / fromEntries mapping.
 */
export interface ExternalMetadata {
  externalized: Record<string, ExternalIIFE | ExternalES>;
}
