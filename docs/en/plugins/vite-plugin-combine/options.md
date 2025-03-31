# Options

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