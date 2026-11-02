import type { LibraryFormats, PluginOption } from 'vite';
import { UserConfig } from 'vite';

type ViteBuildOptions = NonNullable<UserConfig['build']>;
type ViteLibOptions = NonNullable<ViteBuildOptions['lib']>;

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
  fileName?: Exclude<ViteLibOptions, boolean>['fileName'];
  /**
   * The plugins to use.
   *
   * 使用的插件。
   */
  plugins?: PluginOption[];

  /**
   * The resolve options.
   *
   * 解析选项。
   */
  resolve?: UserConfig['resolve'];
}

export interface Options {
  /**
   * The build options.
   *
   * 构建选项。
   */
  build: BuildOptions | BuildOptions[];
}
