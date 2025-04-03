# Option Reference

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
import type { LogLevel } from 'base-log-factory';

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