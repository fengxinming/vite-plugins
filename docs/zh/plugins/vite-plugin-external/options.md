# 配置选项参考

## `externals`
* 类型：`Record<string, any>`
* 必填：`false`

配置外部依赖项。[示例](/zh/plugins/vite-plugin-external/usage#基础使用)

## `logLevel`
* 类型：`"TRACE" | "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL" | "OFF"`
* 必填：`false`
* 默认值：`"WARN"`

设置日志级别。

## `nodeBuiltins`
* 类型：`boolean`
* 必填：`false`

是否排除 Node.js 内置模块。[示例](/zh/plugins/vite-plugin-external/usage#构建时仅排除依赖)

## `externalizeDeps`
* 类型：`Array<string | RegExp>`
* 必填：`false`

指定需要排除的打包依赖项。[示例](/zh/plugins/vite-plugin-external/usage#构建时仅排除依赖)

## `externalGlobals`
* 类型：`(globals: Record<string, any>) => rollup.Plugin`
* 必填：`false`

解决 IIFE 打包问题（[Rollup Issue #3188](https://github.com/rollup/rollup/issues/3188)）。[示例](/zh/plugins/vite-plugin-external/usage#解决-iife-格式的打包问题)

## `rollback`
* 类型：`boolean`
* 必填：`false`

是否回退到旧版实现。

## `interop`
* 类型：`"auto" | undefined`
* 必填：`false`

控制 Vite 的默认构建策略调整。[示例](/zh/plugins/vite-plugin-external/usage#调整打包策略)

## `enforce`
* 类型：`'pre' | 'post'`
* 必填：`false`

设置插件执行顺序。可选值：`pre`（前置）或 `post`（后置）。参考 [Vite 插件顺序](https://cn.vitejs.dev/guide/api-plugin.html#plugin-ordering)。

## `cwd`
* 类型：`string`
* 必填：`false`
* 默认值：`process.cwd()`

设置解析 `cacheDir` 相对路径时的当前工作目录。

## `cacheDir`
* 类型：`string`
* 必填：`false`
* 默认值：`${cwd}/node_modules/.vite_external`

缓存目录路径。

## `[mode: string]`
* 类型：`BasicOptions`
* 必填：`false`

为特定模式配置外部依赖项。[示例](/zh/plugins/vite-plugin-external/usage#多模式场景配置)

---

## TypeScript 类型定义

```typescript
import type { NullValue, Plugin as RollupPlugin } from 'rollup';
import type { ConfigEnv } from 'vite';
import type { LogLevel } from 'vp-runtime-helper';

export type ExternalFn = (
  source: string,
  importer: string | undefined,
  isResolved: boolean
) => string | boolean | NullValue;

export type ModuleNameMap = Record<string, string> | ((id: string) => string);

export type { LogLevel } from 'base-log-factory';

export interface BasicOptions {
  /**
   * 解析 `cacheDir` 路径时的当前工作目录。
   * @default `process.cwd()`
   */
  cwd?: string;

  /**
   * 缓存目录路径
   * @default `${cwd}/node_modules/.vite_external`
   */
  cacheDir?: string;

  /**
   * 外部依赖项配置
   */
  externals?: Record<string, string> | ExternalFn;

  /**
   * 日志级别配置
   */
  logLevel?: LogLevel;
}

export interface Options extends BasicOptions {
  /**
   * 按模式配置的外部依赖项
   */
  [mode: string]: BasicOptions | any;

  /**
   * 回退到旧版实现
   */
  rollback?: boolean;

  /**
   * 控制 Vite 的默认行为
   */
  interop?: 'auto';

  /**
   * 插件执行顺序（"pre" 或 "post"）
   */
  enforce?: 'pre' | 'post';

  /**
   * 是否排除 Node.js 内置模块
   */
  nodeBuiltins?: boolean;

  /**
   * 需要排除的打包依赖项
   */
  externalizeDeps?: Array<string | RegExp>;

  /**
   * 解决 Rollup#3188 问题（https://github.com/rollup/rollup/issues/3188）
   */
  externalGlobals?: (globals: ModuleNameMap) => RollupPlugin;
}

export interface ResolvedOptions extends Options, ConfigEnv {
  cwd: string;
  cacheDir: string;
}
```