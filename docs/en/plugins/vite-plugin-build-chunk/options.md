# Configuration Options


> Type definitions copied verbatim from the plugin TypeScript source:
>
```ts
import type { LibraryFormats, PluginOption } from 'vite';
import { LibraryOptions, UserConfig } from 'vite';

type ViteBuildOptions = NonNullable<UserConfig['build']>;
type BaseBuildOptions = Exclude<ViteBuildOptions, 'rollupOptions' | 'rolldownOptions' | 'lib'>;
type OutputOptions = NonNullable<NonNullable<ViteBuildOptions['rolldownOptions']>['output']>;
type SingleOutputOptions = Exclude<OutputOptions, OutputOptions[]>;

export interface BuildOptions extends BaseBuildOptions, LibraryOptions {
  logLevel?: UserConfig['logLevel'];
  output?: OutputOptions;
  /**
   * Deprecated legacy entry option.
   *
   * A relative value is resolved against the **main build's `outDir`** (legacy
   * behaviour), so it is not equivalent to `entry`, whose relative value resolves
   * against the project root.
   *
   * @deprecated Use `entry` instead and convert the path to be project-root relative.
   */
  chunk?: string;
  /**
   * The chunk name.
   *
   * 构建的 chunk 名称。
   */
  entry: NonNullable<LibraryOptions['entry']>;
  /**
   * The output format.
   *
   * 输出格式。
   */
  format?: LibraryFormats;
  /**
   * The exports type.
   *
   * 导出类型。
   */
  exports?: SingleOutputOptions['exports'];
  /**
   * @deprecated
   */
  plugins?: PluginOption[];

  /**
   * @deprecated
   */
  resolve?: UserConfig['resolve'];
}

export interface Options {
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
| `plugins`       | `PluginOption[]`                                                     | No       | `[]`                   | Additional Vite plugins applied to every secondary build.                |
| `resolve`       | `UserConfig['resolve']`                                              | No       | -                      | `resolve` config passed through to every secondary build.                |

---

### **BuildOptions (Configuration for Each Build Task)**

`BuildOptions` extends Vite's build options (minus `rollupOptions` / `rolldownOptions` / `lib`) and Vite's `build.lib` options, so fields such as `sourcemap`, `minify`, `formats`, `cssFileName` and `emptyOutDir` are also accepted. The most commonly used ones are listed below.

| Parameter       | Type                                                                 | Required | Default Value          | Description                                                                 |
|-----------------|----------------------------------------------------------------------|----------|------------------------|-----------------------------------------------------------------------------|
| `entry`         | `NonNullable<LibraryOptions['entry']>`                                | Yes      | -                      | The file to re-bundle (usually an artifact inside the main build's `outDir`). A relative value is resolved against the **project root**; an absolute path is used as-is. |
| `chunk`         | `string`                                                             | No       | -                      | **Deprecated**; keeps the legacy behaviour only: a relative value is resolved against the **main build's `outDir`**. It is **not** equivalent to `entry` — a relative `entry` resolves against the project root, so convert the path when migrating. |
| `name`          | `string`                                                            | No       | -                      | Global variable name; required when the output format is UMD or IIFE.      |
| `format`        | `'es' \| 'cjs' \| 'umd' \| 'iife'`                                   | No       | `'umd'`                | Build format (defaults to `umd`). Ignored when `formats` is provided.     |
| `sourcemap`     | `boolean \| 'inline' \| 'hidden'`                                    | No       | `false`                | Whether to generate sourcemaps (supports inline or hidden modes).          |
| `exports`       | `'default' \| 'named' \| 'none' \| 'auto'`                           | No       | `'auto'`               | Export type for the Rolldown output.                                      |
| `minify`        | `boolean \| 'terser' \| 'esbuild'`                                   | No       | `false`                | Whether to enable output minification (supports `terser` or `esbuild`).   |
| `outDir`        | `string`                                                            | No       | Main build's `outDir`  | Secondary build's output directory (relative to project root). Note: a relative `entry` resolves against the project root, not this value; only the deprecated `chunk` is resolved against the **main** build's outDir. |
| `fileName`      | `string \| ((format: LibraryFormats, entryName: string) => string)`  | No       | Vite default naming    | Output file name. When **unset**, Vite derives it from the `package.json` `name` (not the entry file name), so rebundling `my-lib.js` does NOT yield `my-lib.*`; set `fileName` explicitly to control the name. A function form returns the exact filename without extra extensions. |
| `plugins`       | `PluginOption[]`                                                     | No       | -                      | **Deprecated** at this level; use the top-level `Options.plugins`.         |
| `resolve`       | `UserConfig['resolve']`                                              | No       | -                      | **Deprecated** at this level; use the top-level `Options.resolve`.         |

---

## TypeScript Definitions

```typescript
import type { LibraryFormats, PluginOption } from 'vite';
import { LibraryOptions, UserConfig } from 'vite';

type ViteBuildOptions = NonNullable<UserConfig['build']>;
type BaseBuildOptions = Exclude<ViteBuildOptions, 'rollupOptions' | 'rolldownOptions' | 'lib'>;
type OutputOptions = NonNullable<NonNullable<ViteBuildOptions['rolldownOptions']>['output']>;
type SingleOutputOptions = Exclude<OutputOptions, OutputOptions[]>;

export interface BuildOptions extends BaseBuildOptions, LibraryOptions {
  logLevel?: UserConfig['logLevel'];
  output?: OutputOptions;
  /**
   * Deprecated legacy entry option.
   *
   * A relative value is resolved against the **main build's `outDir`** (legacy
   * behaviour), so it is not equivalent to `entry`, whose relative value resolves
   * against the project root.
   *
   * @deprecated Use `entry` instead and convert the path to be project-root relative.
   */
  chunk?: string;
  /**
   * The chunk name.
   */
  entry: NonNullable<LibraryOptions['entry']>;
  /**
   * The output format.
   */
  format?: LibraryFormats;
  /**
   * The exports type.
   */
  exports?: SingleOutputOptions['exports'];
  /**
   * @deprecated
   */
  plugins?: PluginOption[];

  /**
   * @deprecated
   */
  resolve?: UserConfig['resolve'];
}

export interface Options {
  /**
   * The plugins to use.
   */
  plugins?: PluginOption[];

  /**
   * The resolve options.
   */
  resolve?: UserConfig['resolve'];
  /**
   * The build options.
   */
  build: BuildOptions | BuildOptions[];
}
```
