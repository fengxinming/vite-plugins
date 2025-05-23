# 配置选项参考

## `logLevel`
* **类型:** `"TRACE" | "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL" | "OFF"`
* **必填:** `false`
* **默认值:** `"WARN"`

## `libs`
* **类型:** `libConfig[]`
* **必填:** `false`

---

## TypeScript 类型定义

```typescript
import type { LogLevel } from 'vp-runtime-helper';
export interface ImportSource {
  es: string;
  cjs?: string;
}

export interface libConfig {
  /**
   * 待转换的库名称，可以是单个字符串或字符串数组
   * Library name(s) to be transformed, can be a single string or an array of strings
   */
  name: string | string[];
  /**
   * 模块的新路径
   * New path for the module
   */
  importFrom?: (importer: string, libName: string) => string | ImportSource;
  /**
   * 插入导入声明
   * Insert import source
   */
  insertFrom?: (importer: string, libName: string) => string | ImportSource | Array<string | ImportSource>;
}

export interface Options {
  /**
   * The value of enforce can be either `"pre"` or `"post"`, see more at https://vitejs.dev/guide/api-plugin.html#plugin-ordering.
   *
   * 强制执行顺序，`pre` 前，`post` 后，参考 https://cn.vitejs.dev/guide/api-plugin.html#plugin-ordering。
   */
  enforce?: 'pre' | 'post';

 /**
  * 插件配置接口，用于定义待转换的库名称及其处理逻辑
  * Interface for plugin configuration to define the library names and processing logic
  */
  libs?: libConfig[];


  /**
   * 输出日志等级
   * Output log level
   */
  logLevel?: LogLevel;
}
```