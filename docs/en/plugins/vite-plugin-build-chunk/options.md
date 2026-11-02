# Configuration Options


> Type definitions copied verbatim from the plugin TypeScript source:
>
```ts
export interface BuildOptions {
  /**
   * The chunk name.
   *
   * 构建的 chunk 名称。
   */
  chunk: string;
  /**
   * Global variable name.
   *
   * 全局变量名。
   */
  name: string;
  /**
   * The output format.
   *
   * 输出格式。
   */
  format?: LibraryFormats;
  /**
   * Whether to generate sourcemaps.
   *
   * 是否生成 sourcemap。
   */
  sourcemap?: boolean | 'inline' | 'hidden';
  /**
   * The exports type.
   *
   * 导出类型。
   */
  exports?: 'default' | 'named' | 'none' | 'auto';
  /**
   * Whether to minify the output.
   *
   * 是否压缩输出。
   */
  minify?: boolean | 'terser' | 'esbuild';
  /**
   * The output directory.
   *
   * 输出目录。
   */
  outDir?: string;
  /**
   * The output file name.
   *
   * 输出文件名。
   */
  fileName?: string | ((format: LibraryFormats, entryName: string) => string);
  /**
   * The plugins to use.
   *
   * 使用的插件。
   */
  plugins?: PluginOption[];

  /**
   * The resolve options.
   *
   * 解析选项。
   */
  resolve?: UserConfig['resolve'];
}

export interface Options {
  /**
   * The build options.
   *
   * 构建选项。
   */
  build: BuildOptions | BuildOptions[];
}
```

## Core Configuration Interfaces

### **Options (Top-level Configuration Object)**
| Parameter       | Type                                                                 | Required | Default Value          | Description                                                                 |
|-----------------|----------------------------------------------------------------------|----------|------------------------|-----------------------------------------------------------------------------|
| `build`         | `BuildOptions[] \| BuildOptions`                                     | Yes      | -                      | Configuration for build tasks (array or single object).                   |

---

### **BuildOptions (Configuration for Each Build Task)**
| Parameter       | Type                                                                 | Required | Default Value          | Description                                                                 |
|-----------------|----------------------------------------------------------------------|----------|------------------------|-----------------------------------------------------------------------------|
| `chunk`         | `string`                                                            | Yes      | -                      | File name inside the main build's output dir (`outDir`).                  |
| `name`          | `string`                                                            | Yes      | -                      | Global variable name (applies only to UMD/IIFE formats).                   |
| `format`        | `'es' \| 'cjs' \| 'umd' \| 'iife'`                                   | No       | `'umd'`                | Build format (defaults to `umd`).                                         |
| `sourcemap`     | `boolean \| 'inline' \| 'hidden'`                                    | No       | `false`                | Whether to generate sourcemaps (supports inline or hidden modes).          |
| `exports`       | `'default' \| 'named' \| 'none' \| 'auto'`                           | No       | `'auto'`               | Export type for Rollup output.                                            |
| `minify`        | `boolean \| 'terser' \| 'esbuild'`                                   | No       | `false`                | Whether to enable output minification (supports `terser` or `esbuild`).   |
| `outDir`        | `string`                                                            | No       | Main build's `outDir`  | Custom output directory (relative to project root).                       |
| `fileName`      | `string \| ((format: LibraryFormats, entryName: string) => string)`  | No       | Default based on format| Custom filename (supports template strings or functions).                 |
| `plugins`       | `PluginOption[]`                                                     | No       | `[]`                   | Additional Vite plugins.                                                  |
| `resolve`       | `UserConfig['resolve']`                                              | No       | -                      | `resolve` config passed through to the secondary build.                   |

---

## TypeScript Definitions

```typescript
import type { LibraryFormats, PluginOption, UserConfig } from 'vite';

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
  fileName?: string | ((format: LibraryFormats, entryName: string) => string);
  /**
   * The plugins to use.
   */
  plugins?: PluginOption[];

  /**
   * The resolve options.
   */
  resolve?: UserConfig['resolve'];
}

export interface Options {
  /**
   * The build options.
   */
  build: BuildOptions | BuildOptions[];
}
```
