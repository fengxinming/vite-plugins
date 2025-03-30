# Option Reference

## `interop`
* Type: `'auto'`
* Required: false

This option controls how Vite handles default values. [Example](/plugins/vite-plugin-external/usage#adjusting-build-strategies)

## `enforce`
* Type: `'pre' | 'post'`
* Required: false

Enforce order. Values: `pre` (before) or `post` (after). Refer to [Vite Plugin Ordering](https://cn.vitejs.dev/guide/api-plugin.html#plugin-ordering).

## `nodeBuiltins`
* Type: `boolean`
* Required: false

Whether to exclude Node.js built-in modules. [Example](/plugins/vite-plugin-external/usage#excluding-dependencies-during-build)

## `externalizeDeps`
* Type: `Array<string | RegExp>`
* Required: false

Specify dependencies to exclude from bundling. [Example](/plugins/vite-plugin-external/usage#excluding-dependencies-during-build)

## `externalGlobals`
* Type: `(globals: Record<string, any>) => rollup.Plugin`
* Required: false

Resolve IIFE Packaging Issues [Rollup Issue #3188](https://github.com/rollup/rollup/issues/3188). [Example](/plugins/vite-plugin-external/usage#solving-iife-build-issues)

## `logLevel`
* Type: `"TRACE" | "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL" | "OFF"`
* Required: false
* Default: `"WARN"`

Sets the logging level.

## `rollback`
* Type: `boolean`
* Required: false

Whether to revert to the legacy implementation.

## `cwd`
* Type: `string`
* Required: false
* Default: `process.cwd()`

Sets the current directory for resolving `cacheDir` relative paths.

## `cacheDir`
* Type: `string`
* Required: false
* Default: `${cwd}/node_modules/.vite_external`

Cache directory path.

## `externals`
* Type: `Record<string, any>`
* Required: false

Configure external dependencies. [Example](/plugins/vite-plugin-external/usage#basic-usage)

## `[mode: string]`
* Type: `BasicOptions`
* Required: false

Configure external dependencies for specific modes. [Example](/plugins/vite-plugin-external/usage#multi-mode-configuration)

---

## TypeScript Definitions

```typescript
import type { LogLevel } from 'base-log-factory';
import type { NullValue, Plugin as RollupPlugin } from 'rollup';
import { ConfigEnv } from 'vite';

export type ExternalFn = (
  source: string,
  importer: string | undefined,
  isResolved: boolean
) => string | boolean | NullValue;

export type ModuleNameMap = Record<string, string> | ((id: string) => string);

export type { LogLevel } from 'base-log-factory';

export interface BasicOptions {
  /**
   * Current working directory for resolving `cacheDir` paths.
   * @default `process.cwd()`
   */
  cwd?: string;

  /**
   * Cache directory path
   * @default `${cwd}/node_modules/.vite_external`
   */
  cacheDir?: string;

  /**
   * External dependencies configuration
   */
  externals?: Record<string, string> | ExternalFn;

  /**
   * Logging level configuration
   */
  logLevel?: LogLevel;
}

export interface Options extends BasicOptions {
  /**
   * Mode-specific external dependencies configuration
   */
  [mode: string]: BasicOptions | any;

  /**
   * Revert to legacy implementation
   */
  rollback?: boolean;

  /**
   * Controls Vite's default handling behavior
   */
  interop?: 'auto';

  /**
   * Plugin execution order ("pre" or "post")
   */
  enforce?: 'pre' | 'post';

  /**
   * Exclude Node.js built-in modules
   */
  nodeBuiltins?: boolean;

  /**
   * Dependencies to exclude from bundling
   */
  externalizeDeps?: Array<string | RegExp>;

  /**
   * Fix Rollup#3188 issue
   */
  externalGlobals?: (globals: ModuleNameMap) => RollupPlugin;
}

export interface ResolvedOptions extends Options, ConfigEnv {
  cwd: string;
  cacheDir: string;
}
