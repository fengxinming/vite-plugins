# 配置项

## `src`

- **类型**: `string | string[]`
- **描述**: 需要合并的文件路径，支持 glob 模式。

## `target`

- **类型**: `string`
- **默认值**: `'index.js'`
- **描述**: 合并后的目标文件路径。

## `exports`

- **类型**: `'named' | 'default' | 'both' | 'none'`
- **默认值**: `'named'`
- **描述**: 导出类型，可选值为 `'named'`（命名导出）、`'default'`（默认导出）、`'none'`（无导出）。

## `overwrite`

- **类型**: `boolean`
- **描述**: 如果目标文件已存在，是否覆盖原文件。

## `nameExport`

- **类型**: `boolean | function`
- **描述**: 是否启用驼峰命名转换，或提供自定义函数生成导出名称。

## `enforce`

- **类型**: `'pre' | 'post'`
- **描述**: 插件执行顺序，`pre` 表示在其他插件之前执行，`post` 表示在其他插件之后执行。

## `cwd`

- **类型**: `string`
- **默认值**: `process.cwd()`
- **描述**: 当前工作目录，默认为项目根目录。

## `logLevel`

- **类型**: `"TRACE" | "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL" | "OFF"`
- **默认值**: `"WARN"`
- **描述**: 输出日志等级。

## `beforeWrite`
- **类型**: `(code: string) => string | void | undefined | null`
- **描述**: 处理代码字符串的函数，在写入文件之前调用。

---

## TypeScript Definitions

```ts
export type NameExport = (name: string, filePath: string) => string;

export interface Options {
  /**
   * Path to the files to be combined, supports glob patterns.
   *
   * 需要合并的文件路径，支持 glob 模式。
   */
  src: string | string[];
  /**
   * Path to the target file after combination.
   *
   * 合并后的目标文件路径。
   *
   * @default 'index.js'
   */
  target: string;

  /**
   * Whether to overwrite the existing target file。
   *
   * 是否覆盖已存在的目标文件。
   *
   * @default false
   */
  overwrite?: boolean;

  /**
   * Custom function or boolean value for controlling the generation of export names.
   *
   * 自定义导出名称的函数或布尔值，用于控制导出名称的生成方式。
   */
  nameExport?: NameExport | boolean;

  /**
   * Exported module types.
   *
   * 导出的模块类型
   *
   * @default 'named'
   */
  exports?: 'named' | 'default' | 'both' | 'none';

  /**
   * The value of enforce can be either `"pre"` or `"post"`, see more at https://vitejs.dev/guide/api-plugin.html#plugin-ordering.
   *
   * 强制执行顺序，`pre` 前，`post` 后，参考 https://cn.vitejs.dev/guide/api-plugin.html#plugin-ordering。
   */
  enforce?: 'pre' | 'post';

  /**
   * Log level
   *
   * 输出日志等级
   */
  logLevel?: LogLevel;

  /**
   * Current Working Directory.
   *
   * 当前工作目录
   */
  cwd?: string;

  /**
   * Handle code before writing to the file.
   *
   * 写入文件前处理代码字符串
   */
  beforeWrite?: (code: string) => string | void | undefined | null;
}
```