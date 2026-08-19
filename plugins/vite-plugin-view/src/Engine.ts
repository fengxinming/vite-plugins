/*
 * Engine 类 — 模板渲染核心引擎
 * Engine class — Core template rendering engine
 *
 * 职责：封装 consolidate 库的模板渲染能力，负责：
 *   1. 校验并存储模板引擎配置（engine、扩展名、选项等）
 *   2. 将 .html 请求路径映射到实际模板文件（.ejs/.pug 等）
 *   3. 调用 consolidate 渲染模板并可选美化输出
 *
 * Responsibilities: Wraps consolidate.js template rendering:
 *   1. Validate & store engine config (name, extension, options)
 *   2. Map .html request paths to actual template files (.ejs/.pug etc.)
 *   3. Invoke consolidate renderer, optionally beautify HTML output
 *
 * 设计选择 / Design choices:
 *   - 使用 consolidate 统一适配 59 种模板引擎，避免逐一集成
 *     Use consolidate to unify 59 template engines instead of one-off integrations.
 *   - engineOptions 支持函数形式，以便拿到 ResolvedConfig 动态生成选项
 *     engineOptions accepts a function for dynamic options with access to ResolvedConfig.
 *   - "pretty" 独立于引擎内部处理，因为 Pug 等引擎弃用了 pretty 参数
 *     "pretty" is applied post-render because engines like Pug deprecated their own pretty flag.
 */
import { existsSync } from 'node:fs';

import engineSource from 'consolidate';
import prettyHTML from 'pretty';
import { ResolvedConfig } from 'vite';

import { logger } from './logger';
import { EngineOptions, Options } from './typings';

export default class Engine {
  engine: string;
  extension: string;
  engineOptions?: EngineOptions;
  pretty?: boolean;
  config!: ResolvedConfig;

  /*
   * 构造函数 — 初始化引擎实例并校验必填参数
   * Constructor — Initializes engine instance and validates required params
   *
   * @param options.engine    模板引擎名称（必填，如 'ejs'、'pug'）
   *                          Template engine name (required, e.g. 'ejs', 'pug')
   * @param options.extension 文件扩展名，默认为 `.${engine}`
   *                          File extension, defaults to `.${engine}`
   * @param options.engineOptions 传给 consolidate 的引擎配置，支持对象或函数
   *                              Engine config passed to consolidate (object or function)
   * @param options.pretty    是否在渲染后美化 HTML（独立于引擎内置美化）
   *                          Whether to beautify HTML after render (engine-agnostic)
   */
  constructor(
    { engine, engineOptions, extension, pretty }: Options
  ) {
    if (!engine) {
      throw new Error('"options.engine" is required.');
    }
    this.engine = engine;
    this.extension = extension || `.${engine}`;
    this.engineOptions = engineOptions;
    this.pretty = pretty;
  }

  /*
   * getTemplate — 将 .html 路径转换为实际模板文件路径
   * getTemplate — Converts a .html request path to the real template file path
   *
   * @param filePath  Vite 请求的 HTML 路径（如 /index.html）
   *                  Requested HTML path from Vite (e.g. /index.html)
   * @returns         模板文件路径（如果存在），否则 undefined
   *                  Template file path if exists, else undefined
   *
   * 设计：Vite 默认请求 index.html，本方法替换扩展名找到真实模板文件。
   * Design: Vite requests index.html by default; we swap extension to find the real template.
   */
  getTemplate(filePath: string): string | undefined {
    const templatePath = filePath.replace('.html', this.extension);
    if (existsSync(templatePath)) {
      return templatePath;
    }
  }

  /*
   * render — 渲染指定模板文件为 HTML 字符串
   * render — Renders the given template file to an HTML string
   *
   * @param filePath  模板文件的绝对路径
   *                  Absolute path to the template file
   * @returns         渲染完成的 HTML 字符串
   *                  Rendered HTML string
   *
   * 关键步骤：
   *   1. 从 consolidate 取出对应引擎的渲染函数
   *   2. 若 engineOptions 是函数则执行，注入 ResolvedConfig
   *   3. 合并默认渲染参数（cache:false 保证开发时热更新生效）并调用渲染
   *   4. 若开启 pretty 则用 pretty 包美化（Pug 等引擎内部已弃用 pretty）
   *
   * Key steps:
   *   1. Retrieve renderer from consolidate by engine name
   *   2. Resolve engineOptions function if needed, injecting ResolvedConfig
   *   3. Merge default render options (cache:false for HMR) and invoke renderer
   *   4. Apply pretty beautification if enabled (engines like Pug dropped native pretty)
   */
  async render(filePath: string): Promise<string> {
    const { engine } = this;
    const engineRender = engineSource[engine];

    if (!engineRender) {
      throw new Error(`Engine "${engine}" is not supported.`);
    }

    logger.debug(`Current engine is "${engine}".`);

    let { engineOptions } = this;
    if (typeof engineOptions === 'function') {
      engineOptions = engineOptions(this.config);
    }
    let html = await engineRender(filePath, Object.assign(
      { cache: false, filename: filePath, ResolvedConfig: this.config },
      engineOptions
    ));

    if (this.pretty) {
      html = prettyHTML(html);
    }

    logger.debug(`"${filePath}" has been rendered.`);
    return html;
  }
}
