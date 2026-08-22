import type { InputOption } from 'rolldown';
import type { ResolvedConfig } from 'vite';
import type { LogLevel } from 'vp-runtime-helper';

export type SupportedTemplateEngines =
  | 'arc-templates'
  | 'atpl'
  | 'bracket'
  | 'dot'
  | 'dust'
  | 'eco'
  | 'ejs'
  | 'ect'
  | 'haml'
  | 'haml-coffee'
  | 'hamlet'
  | 'handlebars'
  | 'hogan'
  | 'htmling'
  | 'jade'
  | 'jazz'
  | 'jqtpl'
  | 'just'
  | 'liquid'
  | 'liquor'
  | 'lodash'
  | 'marko'
  | 'mote'
  | 'mustache'
  | 'nunjucks'
  | 'plates'
  | 'pug'
  | 'qejs'
  | 'ractive'
  | 'razor'
  | 'react'
  | 'slm'
  | 'squirrelly'
  | 'swig'
  | 'teacup'
  | 'templayed'
  | 'toffee'
  | 'twig'
  | 'underscore'
  | 'vash'
  | 'velocityjs'
  | 'walrus'
  | 'whiskers';

export type EngineOptions =
  | Record<string, any>
  | ((config: ResolvedConfig) => Record<string, any> | null | undefined);

export interface Options {
  /**
   * 指定模版引擎名称
   *
   * Specify the template engine name
   */
  engine: SupportedTemplateEngines;

  /**
   * 指定模版引擎入口文件
   *
   * Specify the template engine entry files
   *
   * @default `index${extension}`
   */
  entry?: InputOption;

  /**
   * 用于处理指定扩展名的文件，默认跟引擎名称保持一致
   *
   * Specify the extension of the file to be processed, defaults to the same as the engine name
   *
   * @default `.${engine}`
   */
  extension?: string;

  /**
   * 模版引擎配置
   *
   * Template engine configuration
   */
  engineOptions?: EngineOptions;

  /**
   * 强制美化代码，一些模版引擎可能不建议在渲染时美化(如：pug)或不支持美化，使用此参数在完成渲染后再美化HTML代码
   *
   * Force beautify code
   */
  pretty?: boolean;

  /**
   * 输出日志等级
   *
   * Output log level
   */
  logLevel?: LogLevel;


  /**
   * 强制执行顺序，`pre` 前，`post` 后，参考 https://cn.vitejs.dev/guide/api-plugin.html#plugin-ordering。
   *
   * The value of enforce can be either `"pre"` or `"post"`, see more at https://vitejs.dev/guide/api-plugin.html#plugin-ordering.
   */
  enforce?: 'pre' | 'post';

  /**
   * Whether to output the banner
   *
   * 是否输出 banner
   */
  enableBanner?: boolean;

  /**
   * Request handling strategy for the dev server.
   *
   * - `'intercept'` — Plugin intercepts the request, renders template in memory,
   *   runs `transformIndexHtml`, and sends the response directly. No temporary
   *   `.html` file is written to disk.
   *
   * - `'delegate'`  — Plugin renders the template to a sibling `.html` file on
   *   disk, then calls `next()` to hand the same URL off to Vite's native HTML
   *   pipeline for end-to-end processing. Pre-existing `.html` files are
   *   backed up to `.bak_<timestamp>` before the write and automatically
   *   restored when the dev process terminates (SIGINT / SIGTERM / uncaught
   *   exceptions).
   *
   * dev server 下的请求处理策略。
   *
   * - `'intercept'` — 拦截请求，在内存中渲染模板，调用 `transformIndexHtml`
   *   后直接返回响应。不会向磁盘写入任何临时 `.html` 文件。
   *
   * - `'delegate'`  — 将模板渲染为模板文件同目录下的 `.html` 磁盘文件，
   *   随后 `next()` 交由 Vite 原生 HTML 流水线端到端地处理该 URL。
   *   已存在的 `.html` 文件在写入前会先备份为 `.bak_<时间戳>`，
   *   进程结束时（SIGINT / SIGTERM / 未捕获异常）自动还原备份。
   *
   * @default `'intercept'`
   */
  strategy?: 'intercept' | 'delegate';
}

/**
 * Shared record type for `.html` files emitted by the `delegate` strategy.
 * Owned by `index.ts` (module scope) so the plugin can hand it to the
 * middleware when appropriate.
 *
 *   key   = clean URL (e.g. "/home")
 *   value = {
 *     htmlPath — absolute path of the emitted `.html` file
 *     bakPath  — absolute path of the backup if an existing file was renamed,
 *                null if no backup was needed
 *   }
 *
 * `delegate` 策略写入的 `.html` 文件记录的共享类型。
 * 归 `index.ts`（模块作用域）所有，由插件按需传给中间件。
 *
 *   key   = 干净 URL（如 "/home"）
 *   value = {
 *     htmlPath — 写入的 `.html` 文件绝对路径
 *     bakPath  — 如果原文件被重命名备份，记录备份的绝对路径；
 *                无需备份则为 null
 *   }
 */
export type DelegateWrittenMap = Map<string, { htmlPath: string, bakPath: string | null }>;
