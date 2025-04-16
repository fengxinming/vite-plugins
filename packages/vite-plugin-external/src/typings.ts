import type { NullValue, Plugin as RollupPlugin } from 'rollup';
import type { ConfigEnv } from 'vite';
import type { LogLevel } from 'vp-runtime-helper';

export type ExternalFn = (
  source: string,
  importer: string | undefined,
  isResolved: boolean
) => string | boolean | NullValue;

export type ModuleNameFn = ((id: string) => string);

export type ModuleNameMap = Record<string, string> | ModuleNameFn;

export interface ExternalIIFE {
  name: string;
  external: string;
  resolvedId: string;
  cdn?: string;
}

export type { LogLevel } from 'base-log-factory';

export interface BasicOptions {
  /**
   * External dependencies
   *
   * 配置外部依赖
   */
  externals?: Record<string, string> | ExternalFn;

  /**
   * Log level
   *
   * 输出日志等级
   */
  logLevel?: LogLevel;

  /**
   * The current working directory in which to join `cacheDir`.
   *
   * 设置当前目录，用于拼接 `cacheDir` 的相对路径。
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
}

export interface Options extends BasicOptions {
  /**
   * External dependencies for specific mode
   *
   * 针对指定的模式配置外部依赖
   */
  [mode: string]: BasicOptions | any;

  /**
   * Roll back to the old logic
   *
   * 回退到历史方案
   */
  rollback?: boolean;

  /**
   * Controls how Vite handles default.
   *
   * 该选项用于控制 Vite 如何处理默认值。
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
  externalGlobals?: (globals: ModuleNameMap) => RollupPlugin;

  /**
   * Whether to output the banner
   *
   * 是否输出 banner
   */
  enableBanner?: boolean;
}

export interface ResolvedOptions extends Options, ConfigEnv {
  cwd: string;
  cacheDir: string;
}
