# Options

## `src`

- **Type**: `string | string[]`
- **Description**: Paths of files to be combined, supports glob patterns.

## `target`

- **Type**: `string`
- **Default**: `'index.js'`
- **Description**: Path of the target file after combining files.

## `exports`

- **Type**: `'named' | 'default' | 'both' | 'none'`
- **Default**: `'named'`
- **Description**: Export type: `'named'` (named exports), `'default'` (default export), `'both'` (both named and default), `'none'` (no exports).

## `overwrite`

- **Type**: `boolean`
- **Description**: Whether to overwrite existing target file if it exists.

## `nameExport`

- **Type**: `boolean | function`
- **Description**: Enable camelCase naming conversion or provide a custom function to generate export names.

## `enforce`

- **Type**: `'pre' | 'post'`
- **Description**: Plugin execution order. `'pre'` runs before other plugins, `'post'` runs after. See more at [Vite Plugin Ordering](https://vitejs.dev/guide/api-plugin.html#plugin-ordering).

## `cwd`

- **Type**: `string`
- **Default**: `process.cwd()`
- **Description**: Current working directory, defaults to project root.

## `logLevel`

- **Type**: `"TRACE" | "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL" | "OFF"`
- **Default**: `"WARN"`
- **Description**: Logging level for plugin operations.

## `beforeWrite`

- **Type**: `(code: string) => string | void | undefined | null`
- **Description**: Function to process code before writing to the target file.

---

## TypeScript Definitions

```typescript
export type NameExport = (name: string, filePath: string) => string;

export interface Options {
  /**
   * Path to the files to be combined, supports glob patterns.
   */
  src: string | string[];

  /**
   * Path to the target file after combination.
   * @default 'index.js'
   */
  target: string;

  /**
   * Whether to overwrite the existing target file.
   * @default false
   */
  overwrite?: boolean;

  /**
   * Custom function or boolean value for controlling export name generation.
   */
  nameExport?: NameExport | boolean;

  /**
   * Exported module types.
   * @default 'named'
   */
  exports?: 'named' | 'default' | 'both' | 'none';

  /**
   * Plugin execution order. 'pre' runs before others, 'post' after.
   * @see [Vite Plugin Ordering](https://cn.vitejs.dev/guide/api-plugin.html#plugin-ordering)
   */
  enforce?: 'pre' | 'post';

  /**
   * Logging level configuration.
   */
  logLevel?: LogLevel;

  /**
   * Current working directory.
   */
  cwd?: string;

  /**
   * Process code before writing to the file.
   */
  beforeWrite?: (code: string) => string | void | undefined | null;
}
```