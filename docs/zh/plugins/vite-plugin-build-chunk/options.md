# 配置项


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
   * 已废弃的旧入口选项。
   *
   * 相对值以**主构建的 `outDir`** 为基准解析（旧版行为），因此与 `entry` 不等价：
   * `entry` 的相对值按项目根目录解析。
   *
   * @deprecated 请改用 `entry`，并把路径换算成相对项目根的写法。
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

## 核心配置接口

### **Options（顶层配置对象）**
| 参数         | 类型                                                                 | 必填 | 默认值          | 说明                                                                 |
|--------------|----------------------------------------------------------------------|------|-----------------|----------------------------------------------------------------------|
| `build`      | `BuildOptions[] \| BuildOptions`                                     | 是   | -              | 构建任务配置（数组或单个对象）                                       |
| `plugins`    | `PluginOption[]`                                                     | 否   | `[]`           | 应用到每个二次构建的额外 Vite 插件                                   |
| `resolve`    | `UserConfig['resolve']`                                              | 否   | -              | 透传给每个二次构建的 `resolve` 解析配置                               |

---

### **BuildOptions（每个构建任务的配置）**

`BuildOptions` 继承了 Vite 的构建选项（除 `rollupOptions` / `rolldownOptions` / `lib` 外）以及 Vite 的 `build.lib` 选项，因此 `sourcemap`、`minify`、`formats`、`cssFileName`、`emptyOutDir` 等字段同样可用。下面列出最常用的几项。

| 参数         | 类型                                                                 | 必填 | 默认值          | 说明                                                                 |
|--------------|----------------------------------------------------------------------|------|-----------------|----------------------------------------------------------------------|
| `entry`      | `NonNullable<LibraryOptions['entry']>`                                | 是   | -              | 要二次打包的文件（通常是主构建 `outDir` 内的产物）。相对值按**项目根目录**解析；绝对路径原样使用。 |
| `chunk`      | `string`                                                             | 否   | -              | **已废弃**，仅保留旧版行为：相对值以**主构建的 `outDir`** 为基准解析。注意它与 `entry` **不等价** —— `entry` 的相对值按项目根目录解析，迁移时需自行换算路径。 |
| `name`       | `string`                                                            | 否   | -              | 全局变量名；输出格式为 UMD 或 IIFE 时必填                             |
| `format`     | `'es' \| 'cjs' \| 'umd' \| 'iife'`                                   | 否   | `'umd'`        | 构建格式（默认 `umd`）；提供 `formats` 时该项被忽略                   |
| `sourcemap`  | `boolean \| 'inline' \| 'hidden'`                                    | 否   | `false`        | 是否生成 sourcemap（支持内联或隐藏模式）                           |
| `exports`    | `'default' \| 'named' \| 'none' \| 'auto'`                           | 否   | `'auto'`       | Rolldown 输出的导出类型                                             |
| `minify`     | `boolean \| 'terser' \| 'esbuild'`                                   | 否   | `false`        | 是否启用代码压缩（支持 `terser` 或 `esbuild`）                     |
| `outDir`     | `string`                                                            | 否   | 主构建的 `outDir` | 二次构建的输出目录（相对项目根目录）。注意：`entry` 的相对值按项目根目录解析，与此值无关；只有已废弃的 `chunk` 才以**主构建**的 outDir 为基准。 |
| `fileName`   | `string \| ((format: LibraryFormats, entryName: string) => string)`   | 否   | Vite 默认命名    | 输出文件名。**未设置**时 Vite 以 `package.json` 的 `name` 为基名（而非入口文件名），故二次打包 `my-lib.js` 并不会得到 `my-lib.*`；需显式设置 `fileName` 才能控制名称。函数形式返回的名称即为完整文件名，不再追加扩展名。 |
| `plugins`    | `PluginOption[]`                                                     | 否   | -              | **此层级已废弃**，请改用顶层 `Options.plugins`。                       |
| `resolve`    | `UserConfig['resolve']`                                              | 否   | -              | **此层级已废弃**，请改用顶层 `Options.resolve`。                       |

---

## TypeScript 定义

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
   * 已废弃的旧入口选项。
   *
   * 相对值以**主构建的 `outDir`** 为基准解析（旧版行为），因此与 `entry` 不等价：
   * `entry` 的相对值按项目根目录解析。
   *
   * @deprecated 请改用 `entry`，并把路径换算成相对项目根的写法。
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
