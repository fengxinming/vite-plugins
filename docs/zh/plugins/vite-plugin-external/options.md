# 参数介绍

## 参数定义

**`interop`**
* Type: `'auto'`
* Required: false

该选项用于控制 Vite 如何处理默认值。[示例](/zh/plugins/vite-plugin-external/usage#使用兼容的方式读取外部依赖)

**`enforce`**
* Type: `'pre' | 'post'`
* Required: false

强制执行顺序，`pre` 前，`post` 后，参考 https://cn.vitejs.dev/guide/api-plugin.html#plugin-ordering 。

**`nodeBuiltins`**
* Type: `boolean`
* Required: false

是否排除 nodejs 内置模块。

**`externalizeDeps`**
* Type: `Array<string | RegExp>`
* Required: false

排除不需要打包的依赖。[示例](/zh/plugins/vite-plugin-external/usage#排除不需要打包的依赖)

**`externalGlobals`**
* Type: `(globals: Record<string, any>) => rollup.Plugin`
* Required: false

修复 https://github.com/rollup/rollup/issues/3188 [示例](/zh/plugins/vite-plugin-external/usage#解决-iife-格式的打包问题)

**`cwd`**
* Type: `string`
* Required: false
* Default: `process.cwd()`

设置当前目录，用于拼接 `cacheDir` 的相对路径。

**`cacheDir`**
* Type: `string`
* Required: false
* Default: `${cwd}/node_modules/.vite_external`

缓存文件夹。

**`externals`**
* Type: `Record<string, any>`
* Require: false

配置外部依赖。[示例](/zh/plugins/vite-plugin-external/usage#基础使用)

**`[mode: string]`**
* Type: `BasicOptions`
* Require: false

针对指定的模式配置外部依赖。[示例](/zh/plugins/vite-plugin-external/usage#在不同的模式下覆盖externals)

## Typescript定义

```ts
import { Plugin as RollupPlugin } from 'rollup';
export interface BasicOptions {
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

  /**
   * External dependencies
   *
   * 配置外部依赖
   */
  externals?: Record<string, string>;
}

export interface Options extends BasicOptions {
  /**
   * External dependencies for specific mode
   *
   * 针对指定的模式配置外部依赖
   */
  [mode: string]: BasicOptions | any;

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
  externalGlobals?: (globals: Record<string, string>) => RollupPlugin;
}
```