# Options

## Options Definition

**`interop`**
* Type: `'auto'`
* Required: false

This option controls how Vite handles default values. [Example](/plugins/vite-plugin-external/usage#using-compatible-syntax-to-reference-external-dependencies)

**`enforce`**
* Type: `'pre' | 'post'`
* Required: false

Forces plugin execution order: `'pre'` (before other plugins), `'post'` (after other plugins). Refer to [Vite Plugin Ordering](https://vitejs.dev/guide/api-plugin.html#plugin-ordering).

**`nodeBuiltins`**
* Type: `boolean`
* Required: false

Excludes Node.js built-in modules from the bundle.

**`externalizeDeps`**
* Type: `Array<string | RegExp>`
* Required: false

Specifies dependencies to exclude from bundling. [Example](/plugins/vite-plugin-external/usage#excluding-unneeded-dependencies)

**`externalGlobals`**
* Type: `(globals: Record<string, any>) => rollup.Plugin`
* Required: false

Fixes [Rollup issue #3188](https://github.com/rollup/rollup/issues/3188). [Example](#solving-iife-bundling-issues)

**`cwd`**
* Type: `string`
* Required: false
* Default: `process.cwd()`

Sets current working directory for resolving `cacheDir` relative paths.

**`cacheDir`**
* Type: `string`
* Required: false
* Default: `${cwd}/node_modules/.vite_external`

Cache directory path.

**`externals`**
* Type: `Record<string, string>`
* Required: false

Configures external dependencies. [Example](/plugins/vite-plugin-external/usage#basic-usage)

**`[mode: string]`**
* Type: `BasicOptions`
* Required: false

Configures external dependencies for specific modes. [Example](/plugins/vite-plugin-external/usage#overriding-externals-in-different-modes)

---

## TypeScript Definitions

```typescript
import { Plugin as RollupPlugin } from 'rollup';

export interface BasicOptions {
  /**
   * Current working directory for resolving `cacheDir`
   * @default `process.cwd()`
   */
  cwd?: string;

  /** Cache folder path */
  cacheDir?: string;

  /**
   * External dependencies configuration
   */
  externals?: Record<string, string>;
}

export interface Options extends BasicOptions {
  /**
   * Mode-specific external dependency configurations
   */
  [mode: string]: BasicOptions | any;

  /** Controls default value handling */
  interop?: 'auto';

  /**
   * Plugin execution order
   * @see [Vite Plugin Ordering](https://vitejs.dev/guide/api-plugin.html#plugin-ordering)
   */
  enforce?: 'pre' | 'post';

  /** Exclude Node.js built-in modules */
  nodeBuiltins?: boolean;

  /** Dependencies to exclude from bundling */
  externalizeDeps?: Array<string | RegExp>;

  /**
   * Rollup plugin for global externals
   * Fixes [Rollup issue #3188](https://github.com/rollup/rollup/issues/3188)
   */
  externalGlobals?: (globals: Record<string, string>) => RollupPlugin;
}
