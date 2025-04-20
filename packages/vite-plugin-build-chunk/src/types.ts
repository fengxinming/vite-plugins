import { ModuleFormat } from 'rollup';
import type { LibraryFormats, PluginOption } from 'vite';
import { LogLevel } from 'vp-runtime-helper';

export interface BuildOptions {
  /**
   * The chunk name.
   *
   * 构建的 chunk 名称。
   */
  chunk: string;
  /**
   * Global variable name.
   *
   * 全局变量名。
   */
  name: string;
  /**
   * The output format.
   *
   * 输出格式。
   */
  format?: LibraryFormats;
  /**
   * Whether to generate sourcemaps.
   *
   * 是否生成 sourcemap。
   */
  sourcemap?: boolean | 'inline' | 'hidden';
  /**
   * The exports type.
   *
   * 导出类型。
   */
  exports?: 'default' | 'named' | 'none' | 'auto';
  /**
   * Whether to minify the output.
   *
   * 是否压缩输出。
   */
  minify?: boolean | 'terser' | 'esbuild';
  /**
   * The output directory.
   *
   * 输出目录。
   */
  outDir?: string;
  /**
   * The output file name.
   *
   * 输出文件名。
   */
  fileName?: string | ((format: ModuleFormat, entryName: string) => string);
  /**
   * The plugins to use.
   *
   * 使用的插件。
   */
  plugins?: PluginOption[];
}

export interface Options {
  /**
   * The build options.
   *
   * 构建选项。
   */
  build: BuildOptions | BuildOptions[];

  /**
   * The log level to use.
   *
   * 日志等级。
   */
  logLevel?: LogLevel;

  /**
   * Whether to output the banner
   *
   * 是否输出 banner
   */
  enableBanner?: boolean;
}
