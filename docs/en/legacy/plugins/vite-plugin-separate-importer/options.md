
::: danger This is Vite 1.x – 6.x LEGACY documentation archive / 这是 Vite 1.x – 6.x 旧版文档归档
- These pages correspond to old plugin releases: **vite-plugin-view ≤ 4.x, vite-plugin-external ≤ 7.x, vite-plugin-build-chunk ≤ 4.x, etc.**
- Bundler covered: Rollup + esbuild (the default Vite 6 and below stack). **This does NOT apply to Vite 8+ with the new Rolldown bundler**; Vite 7/8+ users, go to the current docs immediately.
- Content under this folder is frozen and unmaintained. For any new option / field, check the current docs:
  - Latest English docs: [/guide/introduction](/guide/introduction)
  - 最新中文文档：[/zh/guide/introduction](/zh/guide/introduction)
:::
# Option Reference (legacy)


> Type definitions copied verbatim from the plugin TypeScript source:
>
```ts
export interface ImportSource {
  es: string;
  cjs?: string;
  name?: string;
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
   * Apply the plugin only for serve or build, or on certain conditions.
   *
   * 应用插件仅在 serve 或 build 时，或满足某些条件的情况下。
   */
  apply?: 'serve' | 'build' | ((this: void, config: UserConfig, env: ConfigEnv) => boolean);

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

  /**
   * Whether to output the banner
   *
   * 是否输出 banner
   */
  enableBanner?: boolean;
}
```

## `logLevel`
* **Type:** `"TRACE" | "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL" | "OFF"`
* **Required:** `false`
* **Default:** `"WARN"`

## `libs`
* **Type:** `libConfig[]`
* **Required:** `false`

---

# TypeScript Type Definitions

```typescript
import type { LogLevel } from 'vp-runtime-helper';

export interface ImportSource {
  es: string;
  cjs?: string;
}

export interface libConfig {
  /**
   * Name(s) of the library to be transformed, can be a single string or an array of strings.
   */
  name: string | string[];
  /**
   * New path for the module.
   */
  importFrom?: (importer: string, libName: string) => string | ImportSource;
  /**
   * Specify the import source to insert.
   */
  insertFrom?: (importer: string, libName: string) => string | ImportSource | Array<string | ImportSource>;
}

export interface Options {
  /**
   * The value of `enforce` can be either `"pre"` or `"post"`, see more at https://vitejs.dev/guide/api-plugin.html#plugin-ordering.
   */
  enforce?: 'pre' | 'post';

  /**
   * Configuration interface defining libraries and their transformation logic.
   */
  libs?: libConfig[];

  /**
   * Log level for plugin output.
   */
  logLevel?: LogLevel;
}
```
