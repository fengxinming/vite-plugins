# 配置项

## 核心配置接口

### **Options（顶层配置对象）**
| 参数         | 类型                                                                 | 必填 | 默认值          | 说明                                                                 |
|--------------|----------------------------------------------------------------------|------|-----------------|----------------------------------------------------------------------|
| `build`      | `BuildOptions[] \| BuildOptions`                                     | 是   | -              | 构建任务配置（数组或单个对象）                                       |
| `logLevel`   | `LogLevel` (来自 `vp-runtime-helper`)                                | 否   | `'info'`       | 日志等级（如 `'error'`, `'warn'`, `'info'`）                         |
| `enableBanner`| `boolean`                                                           | 否   | `false`        | 是否输出构建 banner（如版本信息）                                    |

---

### **BuildOptions（每个构建任务的配置）**
| 参数         | 类型                                                                 | 必填 | 默认值          | 说明                                                                 |
|--------------|----------------------------------------------------------------------|------|-----------------|----------------------------------------------------------------------|
| `chunk`      | `string`                                                            | 是   | -              | 入口文件路径（相对项目根目录）                                     |
| `name`       | `string`                                                            | 是   | `'default'`    | 全局变量名（仅在 UMD/IIFE 格式生效）                               |
| `format`     | `'es' \| 'cjs' \| 'umd' \| 'iife'`                                   | 否   | `'umd'`        | 构建格式（默认 `umd`）                                             |
| `sourcemap`  | `boolean \| 'inline' \| 'hidden'`                                    | 否   | `false`        | 是否生成 sourcemap（支持内联或隐藏模式）                           |
| `exports`    | `'default' \| 'named' \| 'none' \| 'auto'`                           | 否   | `'auto'`       | Rollup 输出的导出类型                                             |
| `minify`     | `boolean \| 'terser' \| 'esbuild'`                                   | 否   | `false`        | 是否启用代码压缩（支持 `terser` 或 `esbuild`）                     |
| `outDir`     | `string`                                                            | 否   | 主构建的 `outDir` | 自定义输出目录（相对项目根目录）                                  |
| `fileName`   | `string \| ((format: string, entryName: string) => string)`          | 否   | 根据格式生成默认名称 | 自定义文件名（支持模板字符串或函数）                               |
| `plugins`    | `PluginOption[]`                                                     | 否   | `[]`           | 额外的 Vite 插件列表                                               |

---

## TypeScript 定义

```typescript
import { ModuleFormat } from 'rollup';
import type { LibraryFormats, PluginOption } from 'vite';
import { LogLevel } from 'vp-runtime-helper';

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
  fileName?: string | ((format: ModuleFormat, entryName: string) => string);
  /**
   * The plugins to use.
   *
   * 使用的插件。
   */
  plugins?: PluginOption[];
}

export interface Options {
  /**
   * The build options.
   *
   * 构建选项。
   */
  build: BuildOptions | BuildOptions[];

  /**
   * The log level to use.
   *
   * 日志等级。
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