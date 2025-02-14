import { Plugin } from 'rollup';
export interface BasicOptions {
  /**
   * The current working directory in which to join `cacheDir`.
   *
   * 用于拼接 `cacheDir` 的路径。
   *
   * @default `process.cwd()`
   */
  cwd?: string;

  /**
   * Cache folder
   *
   * 缓存文件夹
   *
   * @default `${cwd}/node_modules/.vite_external`
   */
  cacheDir?: string;

  /**
   * External dependencies
   *
   * 配置外部依赖
   */
  externals?: Record<string, any>;
}

export interface Options extends BasicOptions {
  /**
   * External dependencies for specific mode
   *
   * 针对指定的模式配置外部依赖
   */
  [mode: string]: BasicOptions | any;

  /**
   * Different `externals` can be specified in different modes.
   *
   * 在不同的模式下，可以指定不同的外部依赖。
   */
  mode?: string;

  /**
   * Controls how Rollup handles default.
   *
   * 用于控制读取外部依赖的默认值。
   */
  interop?: 'auto';

  /**
   * The value of enforce can be either `"pre"` or `"post"`, see more at https://vitejs.dev/guide/api-plugin.html#plugin-ordering.
   *
   * 强制执行顺序，`pre` 前，`post` 后，参考 https://cn.vitejs.dev/guide/api-plugin.html#plugin-ordering。
   */
  enforce?: 'pre' | 'post';

  /**
   * Whether to exclude nodejs built-in modules in the bundle
   *
   * 是否排除 nodejs 内置模块。
   */
  nodeBuiltins?: boolean;

  /**
   * Specify dependencies to not be included in the bundle
   *
   * 排除不需要打包的依赖。
   */
  externalizeDeps?: Array<string | RegExp>;

  /**
   * Fix https://github.com/rollup/rollup/issues/3188
   */
  externalGlobals?: (globals: Record<string, any>) => Plugin;
}
