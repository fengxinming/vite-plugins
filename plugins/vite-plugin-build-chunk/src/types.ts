import type { LibraryFormats, PluginOption } from 'vite';
import { LibraryOptions, UserConfig } from 'vite';

type ViteBuildOptions = NonNullable<UserConfig['build']>;
type BaseBuildOptions = Exclude<ViteBuildOptions, 'rollupOptions' | 'rolldownOptions' | 'lib'>;
type OutputOptions = NonNullable<NonNullable<ViteBuildOptions['rolldownOptions']>['output']>;
type SingleOutputOptions = Exclude<OutputOptions, OutputOptions[]>;

export interface BuildOptions extends BaseBuildOptions, LibraryOptions {
  logLevel?: UserConfig['logLevel'];
  output?: OutputOptions;
  /**
   * @deprecated
   */
  chunk?: string;
  /**
   * The chunk name.
   *
   * 构建的 chunk 名称。
   */
  entry: NonNullable<LibraryOptions['entry']>;
  /**
   * The output format.
   *
   * 输出格式。
   */
  format?: LibraryFormats;
  /**
   * The exports type.
   *
   * 导出类型。
   */
  exports?: SingleOutputOptions['exports'];
  /**
   * @deprecated
   */
  plugins?: PluginOption[];

  /**
   * @deprecated
   */
  resolve?: UserConfig['resolve'];
}

export interface Options {
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
  /**
   * The build options.
   *
   * 构建选项。
   */
  build: BuildOptions | BuildOptions[];
}
