import type { InputOption, NullValue } from 'rollup';
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
  | ((config: ResolvedConfig) => Record<string, any> | NullValue);

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
}
