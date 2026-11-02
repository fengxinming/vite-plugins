import type { ConfigEnv, Rolldown } from 'vite';

import { Options } from './types';

/**
 * 内部"最终版选项"形态，由 buildOptions() 生成后透传给所有下游步骤。
 *
 * buildOptions() 的处理包括：合并模式 override、补齐 cwd/cacheDir 默认值、
 * 设置日志级别、再把 ConfigEnv 字段（mode、command 等）一起挂上去。
 * 这样下游判断"现在是 build 还是 serve"时，不需要再单独拿 ConfigEnv 参数。
 */
export interface ResolvedOptions extends Options, ConfigEnv {
  cwd: string;
  cacheDir: string;
}

/**
 * IIFE 全局变量形态的 stash 条目（如 {react:'React'}）。
 *
 * 字段说明：
 *   - format    ：标记为 iife，与 ES 格式区分（discriminated union tag）
 *   - moduleId  ：裸 import 名称（如 'react'、'react-dom/client'），用于日志、metadata 清理
 *   - stashPath ：stash 文件的绝对磁盘路径（写 CJS shim 的那个文件），作为 resolve 返回的目标
 *   - globalName：全局变量名（如 'React'），用于 output.globals 反查
 *
 * 为什么需要 stash 文件（而不是直接标 external）？
 *   1. Dev：DepsOptimizer 预打包时必须有真实文件才能扫描；
 *   2. Build（非 IIFE 输出）：纯 external 会残留裸 import "react"，
 *      而 stash 文件让 Rolldown 能打包进一个正确的 CJS/ESM shim；
 *   3. IIFE 输出：setOutputGlobals 通过读取 globalName 字段来反查
 *      output.globals 的映射关系。
 */
export interface ExternalIIFE {
  format: 'iife';
  moduleId: string;
  stashPath: string;
  globalName: string;
}

/**
 * ESM CDN 链接形态的 stash 条目（如 {react:'https://esm.sh/react@18.3.1'}）。
 *
 * 字段说明：
 *   - format    ：标记为 es，与 IIFE 格式区分（discriminated union tag）
 *   - moduleId  ：裸 import 名称（如 'react'）
 *   - stashPath ：stash 文件的绝对磁盘路径（写 ESM 重导出 shim 的那个文件）
 *   - cdnUrl    ：CDN 的绝对 URL，stash 文件内容从这里重导出；transformIndexHtml
 *                 遍历 stashMap 时根据 cdnUrl 注入 <link rel="modulepreload">，
 *                 让浏览器首屏就预取 CDN 模块。
 *
 * 与 IIFE 的差异：stash 文件内容改为从 CDN 重导出（export * from <cdnUrl>），
 * 浏览器自身去加载那个绝对 URL 的 ESM 模块，而不是读 window 上的全局变量。
 */
export interface ExternalES {
  format: 'es';
  moduleId: string;
  stashPath: string;
  cdnUrl: string;
}

/**
 * 插件自建 metadata（`${cacheDir}/_metadata.json`）的文件格式。
 *
 * externalized：模块名 → stash 条目的映射，与内存里的 stashMap 同构。
 *
 * 它是一份**给下一次 dev 启动用的名单**，不参与 external 判定，build 阶段完全不碰：
 *   - 写：预构建插件的 buildEnd，记下本轮 dev 预构建涉及的 external；
 *   - 读（取 keys）：configResolved 且 command === 'serve' —— 拿这批模块名去清
 *     Vite 自己的 deps 缓存条目，迫使它重新预构建；
 *   - 读（取条目）：closeServer 且 reason === 'restart' —— 改 vite.config 触发重启时
 *     插件实例重建、stashMap 清空，而 DepsOptimizer 不会重跑，此时靠它恢复
 *     format / cdnUrl，否则 transformIndexHtml 注入不出 CDN 的 modulepreload。
 *
 * 为什么存完整条目而不只是模块名：名单只服务 cleanupCache，但 restart 场景还需要
 * format（判断 ES external）与 cdnUrl（拼 modulepreload 的 href），所以一并保留。
 * Why full entries: the list alone serves cleanupCache, but the restart path also needs
 * `format` and `cdnUrl` to rebuild the modulepreload tags.
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

export type RolldownOutputOptions = Exclude<Rolldown.RolldownOptions['output'], string | undefined | any[]>;
