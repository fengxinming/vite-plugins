# Configuration Options

## Core Configuration Interfaces

### **Options (Top-level Configuration Object)**
| Parameter       | Type                                                                 | Required | Default Value          | Description                                                                 |
|-----------------|----------------------------------------------------------------------|----------|------------------------|-----------------------------------------------------------------------------|
| `build`         | `BuildOptions[] \| BuildOptions`                                     | Yes      | -                      | Configuration for build tasks (array or single object).                   |
| `logLevel`      | `LogLevel` (from `vp-runtime-helper`)                                | No       | `'info'`               | Log level (e.g., `'error'`, `'warn'`, `'info'`).                          |
| `enableBanner`  | `boolean`                                                           | No       | `false`                | Whether to output a build banner (e.g., version information).              |

---

### **BuildOptions (Configuration for Each Build Task)**
| Parameter       | Type                                                                 | Required | Default Value          | Description                                                                 |
|-----------------|----------------------------------------------------------------------|----------|------------------------|-----------------------------------------------------------------------------|
| `chunk`         | `string`                                                            | Yes      | -                      | Entry file path (relative to project root).                               |
| `name`          | `string`                                                            | Yes      | `'default'`            | Global variable name (applies only to UMD/IIFE formats).                   |
| `format`        | `'es' \| 'cjs' \| 'umd' \| 'iife'`                                   | No       | `'umd'`                | Build format (defaults to `umd`).                                         |
| `sourcemap`     | `boolean \| 'inline' \| 'hidden'`                                    | No       | `false`                | Whether to generate sourcemaps (supports inline or hidden modes).          |
| `exports`       | `'default' \| 'named' \| 'none' \| 'auto'`                           | No       | `'auto'`               | Export type for Rollup output.                                            |
| `minify`        | `boolean \| 'terser' \| 'esbuild'`                                   | No       | `false`                | Whether to enable output minification (supports `terser` or `esbuild`).   |
| `outDir`        | `string`                                                            | No       | Main build's `outDir`  | Custom output directory (relative to project root).                       |
| `fileName`      | `string \| ((format: string, entryName: string) => string)`          | No       | Default based on format| Custom filename (supports template strings or functions).                 |
| `plugins`       | `PluginOption[]`                                                     | No       | `[]`                   | Additional Vite plugins.                                                  |

---

## TypeScript Definitions

```typescript
import { ModuleFormat } from 'rollup';
import type { LibraryFormats, PluginOption } from 'vite';
import { LogLevel } from 'vp-runtime-helper';

export interface BuildOptions {
  /**
   * The chunk name.
   */
  chunk: string;
  /**
   * Global variable name.
   */
  name: string;
  /**
   * The output format.
   */
  format?: LibraryFormats;
  /**
   * Whether to generate sourcemaps.
   */
  sourcemap?: boolean | 'inline' | 'hidden';
  /**
   * The exports type.
   */
  exports?: 'default' | 'named' | 'none' | 'auto';
  /**
   * Whether to minify the output.
   */
  minify?: boolean | 'terser' | 'esbuild';
  /**
   * The output directory.
   */
  outDir?: string;
  /**
   * The output file name.
   */
  fileName?: string | ((format: ModuleFormat, entryName: string) => string);
  /**
   * The plugins to use.
   */
  plugins?: PluginOption[];
}

export interface Options {
  /**
   * The build options.
   */
  build: BuildOptions | BuildOptions[];

  /**
   * The log level to use.
   */
  logLevel?: LogLevel;

  /**
   * Whether to output the banner
   */
  enableBanner?: boolean;
}
```
