# 配置选项参考


> Type definitions copied verbatim from the plugin TypeScript source:
>
```ts
export type SupportedTemplateEngines =
  | 'arc-templates'
  | 'atpl'
  | 'bracket'
  | 'dot'
  | 'dust'
  | 'eco'
  | 'ejs'
  | 'ect'
  | 'haml'
  | 'haml-coffee'
  | 'hamlet'
  | 'handlebars'
  | 'hogan'
  | 'htmling'
  | 'jade'
  | 'jazz'
  | 'jqtpl'
  | 'just'
  | 'liquid'
  | 'liquor'
  | 'lodash'
  | 'marko'
  | 'mote'
  | 'mustache'
  | 'nunjucks'
  | 'plates'
  | 'pug'
  | 'qejs'
  | 'ractive'
  | 'razor'
  | 'react'
  | 'slm'
  | 'squirrelly'
  | 'swig'
  | 'teacup'
  | 'templayed'
  | 'toffee'
  | 'twig'
  | 'underscore'
  | 'vash'
  | 'velocityjs'
  | 'walrus'
  | 'whiskers';

export type EngineOptions =
  | Record<string, any>
  | ((config: ResolvedConfig) => Record<string, any> | NullValue);

export interface Options {
  /**
   * 指定模版引擎名称
   *
   * Specify the template engine name
   */
  engine: SupportedTemplateEngines;

  /**
   * 指定模版引擎入口文件
   *
   * Specify the template engine entry files
   *
   * @default `index${extension}`
   */
  entry?: InputOption;

  /**
   * 用于处理指定扩展名的文件，默认跟引擎名称保持一致
   *
   * Specify the extension of the file to be processed, defaults to the same as the engine name
   *
   * @default `.${engine}`
   */
  extension?: string;

  /**
   * 模版引擎配置
   *
   * Template engine configuration
   */
  engineOptions?: EngineOptions;

  /**
   * 强制美化代码，一些模版引擎可能不建议在渲染时美化(如：pug)或不支持美化，使用此参数在完成渲染后再美化HTML代码
   *
   * Force beautify code
   */
  pretty?: boolean;

  /**
   * 输出日志等级
   *
   * Output log level
   */
  logLevel?: LogLevel;


  /**
   * 强制执行顺序，`pre` 前，`post` 后，参考 https://cn.vitejs.dev/guide/api-plugin.html#plugin-ordering。
   *
   * The value of enforce can be either `"pre"` or `"post"`, see more at https://vitejs.dev/guide/api-plugin.html#plugin-ordering.
   */
  enforce?: 'pre' | 'post';

  /**
   * Whether to output the banner
   *
   * 是否输出 banner
   */
  enableBanner?: boolean;
}
```

## Options 配置接口
插件核心配置选项：

| 属性名          | 类型                        | 描述                                                                                               | 默认值               |
|----------------|----------------------------|---------------------------------------------------------------------------------------------------|----------------------|
| **engine**     | `SupportedTemplateEngines` | 必填项，指定模板引擎名称                                                                              | -                    |
| entry          | `InputOption`              | 模板引擎入口文件配置，Vite 8 起支持对象形式 `{ index: 'index.ejs', home: 'home.ejs' }` 用于多页面 MPA        | `index${extension}`  |
| extension      | `string`                   | 需要处理的文件扩展名，默认与引擎名称一致                                                                 | `.${engine}`         |
| engineOptions  | `EngineOptions`            | 模板引擎配置选项                                                                                     | -                    |
| pretty         | `boolean`                  | 强制美化代码输出（部分引擎不建议渲染时美化）                                                              | `false`              |
| logLevel       | `LogLevel`                 | 日志等级控制                                                                                        | -                    |
| enableBanner   | `boolean`                  | 是否输出启动 banner                                                                                 | `true`               |
| enforce        | `'pre' | 'post'`           | 插件执行顺序控制（参考 Vite 插件排序规则）。Vite 8 默认 `'pre'`，因为 Rolldown 会跳过磁盘入口的 resolveId，必须前置拦截 | `'pre'`（Vite 8）     |

## SupportedTemplateEngines 枚举类型
支持的模板引擎列表，包含以下 59 种类型：

```typescript
type SupportedTemplateEngines =
  | 'arc-templates'
  | 'atpl'
  | 'bracket'
  | 'dot'
  | 'dust'
  | 'eco'
  | 'ejs'
  | 'ect'
  | 'haml'
  | 'haml-coffee'
  | 'hamlet'
  | 'handlebars'
  | 'hogan'
  | 'htmling'
  | 'jade'
  | 'jazz'
  | 'jqtpl'
  | 'just'
  | 'liquid'
  | 'liquor'
  | 'lodash'
  | 'marko'
  | 'mote'
  | 'mustache'
  | 'nunjucks'
  | 'plates'
  | 'pug'
  | 'qejs'
  | 'ractive'
  | 'razor'
  | 'react'
  | 'slm'
  | 'squirrelly'
  | 'swig'
  | 'teacup'
  | 'templayed'
  | 'toffee'
  | 'twig'
  | 'underscore'
  | 'vash'
  | 'velocityjs'
  | 'walrus'
  | 'whiskers';
```

## EngineOptions 类型
模板引擎配置类型，支持两种形式：
```typescript
type EngineOptions =
  | Record<string, any>
  | ((config: ResolvedConfig) => Record<string, any> | NullValue);
```

### 配置说明
- **engine**: 必须指定模板引擎名称（参考 `SupportedTemplateEngines` 列表）
- **extension**: 若未指定则自动使用引擎名称作为扩展名（如 `pug` 对应 `.pug`）
- **enforce**: 取值需符合 Vite 插件执行顺序规范（[详情](https://vitejs.dev/guide/api-plugin.html#plugin-ordering)）

## Vite 8 新增

### `entry` 对象形式（多页面 MPA）
从 Vite 8 开始，`entry` 选项接受对象形式来配置多页面应用（MPA），每个 key 对应输出的 HTML 文件名，value 为模板文件路径：

```typescript
entry: {
  index: 'index.ejs',
  home: 'home.ejs'
}
```

构建后会生成 `dist/index.html` 和 `dist/home.html` 两个页面。

### MPA + IIFE 打包注意事项
如果使用 MPA 且构建输出格式为 IIFE，必须在 Vite 配置中显式开启代码分割，否则 Rolldown（Vite 8 的打包器）会抛出 `INVALID_OPTION` 错误：

```typescript
export default defineConfig({
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: true
      }
    }
  }
})
```

### 为什么默认 `enforce: 'pre'`
Vite 8 使用 Rolldown 作为打包器，对于磁盘上已存在的入口文件，Rolldown 会跳过插件链的 `resolveId` 钩子。因此 vite-plugin-view 必须以 `'pre'` 顺序执行，才能在 Rolldown 之前拦截模板文件的解析，将 `.ejs`、`.pug` 等模板渲染为 HTML。

## 关键类型引用
- `LogLevel` 来自 `vp-runtime-helper` 包
- `InputOption` 来自 `rollup` 包
- `ResolvedConfig` 来自 `vite` 包

## TypeScript 类型定义

```typescript
import type { InputOption, NullValue } from 'rollup';
import type { ResolvedConfig } from 'vite';
import type { LogLevel } from 'vp-runtime-helper';

export type SupportedTemplateEngines =
  | 'arc-templates'
  | 'atpl'
  | 'bracket'
  | 'dot'
  | 'dust'
  | 'eco'
  | 'ejs'
  | 'ect'
  | 'haml'
  | 'haml-coffee'
  | 'hamlet'
  | 'handlebars'
  | 'hogan'
  | 'htmling'
  | 'jade'
  | 'jazz'
  | 'jqtpl'
  | 'just'
  | 'liquid'
  | 'liquor'
  | 'lodash'
  | 'marko'
  | 'mote'
  | 'mustache'
  | 'nunjucks'
  | 'plates'
  | 'pug'
  | 'qejs'
  | 'ractive'
  | 'razor'
  | 'react'
  | 'slm'
  | 'squirrelly'
  | 'swig'
  | 'teacup'
  | 'templayed'
  | 'toffee'
  | 'twig'
  | 'underscore'
  | 'vash'
  | 'velocityjs'
  | 'walrus'
  | 'whiskers';

export type EngineOptions =
  | Record<string, any>
  | ((config: ResolvedConfig) => Record<string, any> | NullValue);

export interface Options {
  /**
   * 指定模版引擎名称
   *
   * Specify the template engine name
   */
  engine: SupportedTemplateEngines;

  /**
   * 指定模版引擎入口文件
   *
   * Specify the template engine entry files
   *
   * @default `index${extension}`
   */
  entry?: InputOption;

  /**
   * 用于处理指定扩展名的文件，默认跟引擎名称保持一致
   *
   * Specify the extension of the file to be processed, defaults to the same as the engine name
   *
   * @default `.${engine}`
   */
  extension?: string;

  /**
   * 模版引擎配置
   *
   * Template engine configuration
   */
  engineOptions?: EngineOptions;

  /**
   * 强制美化代码，一些模版引擎可能不建议在渲染时美化(如：pug)或不支持美化，使用此参数在完成渲染后再美化HTML代码
   *
   * Force beautify code
   */
  pretty?: boolean;

  /**
   * 输出日志等级
   *
   * Output log level
   */
  logLevel?: LogLevel;

  /**
   * 是否输出启动 banner
   *
   * Whether to print the startup banner
   *
   * @default true
   */
  enableBanner?: boolean;

  /**
   * 强制执行顺序，`pre` 前，`post` 后，参考 https://cn.vitejs.dev/guide/api-plugin.html#plugin-ordering。
   * Vite 8 默认 `'pre'`，因为 Rolldown 会跳过磁盘入口的 resolveId，必须前置拦截。
   *
   * The value of enforce can be either `"pre"` or `"post"`, see more at https://vitejs.dev/guide/api-plugin.html#plugin-ordering.
   * Defaults to `'pre'` in Vite 8 because Rolldown skips resolveId for on-disk entries; a 'pre' plugin must intercept first.
   *
   * @default 'pre'
   */
  enforce?: 'pre' | 'post';
}
```