import type { ConfigEnv } from 'vite';

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
