# Configuration Options Reference


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

## Options Configuration Interface
Core configuration options for the plugin:

| Property          | Type                          | Description                                                                                                           | Default Value               |
|-------------------|-------------------------------|-----------------------------------------------------------------------------------------------------------------------|-----------------------------|
| **engine**        | `SupportedTemplateEngines`    | **Mandatory** - Specify the template engine name.                                                                     | -                           |
| entry             | `InputOption`                 | Entry file configuration. Vite 8+ accepts objects like `{ index: 'index.ejs', home: 'home.ejs' }` for multi-page MPA. | `index${extension}`         |
| extension         | `string`                      | File extension to process (defaults to the engine name if unspecified).                                                | `.${engine}`                |
| engineOptions     | `EngineOptions`               | Configuration options for the template engine.                                                                        | -                           |
| pretty            | `boolean`                     | Force code beautification (some engines like Pug may not recommend this).                                             | `false`                     |
| logLevel          | `LogLevel`                    | Control log level output.                                                                                             | -                           |
| enableBanner      | `boolean`                     | Whether to print the startup banner.                                                                                  | `true`                      |
| enforce           | `'pre' | 'post'`              | Plugin execution order. Vite 8 defaults to `'pre'` because Rolldown skips resolveId for on-disk entries.              | `'pre'` (Vite 8)            |

---

## SupportedTemplateEngines Enumeration
List of supported template engines (59 engines):

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

---

## EngineOptions Type
Template engine configuration type supports two forms:
```typescript
type EngineOptions =
  | Record<string, any>
  | ((config: ResolvedConfig) => Record<string, any> | NullValue);
```

### Configuration Notes
- **engine**: Must specify a template engine name from the `SupportedTemplateEngines` list.
- **extension**: Defaults to the engine name (e.g., `pug` corresponds to `.pug`).
- **enforce**: Values must follow Vite's plugin execution order rules ([details](https://vitejs.dev/guide/api-plugin.html#plugin-ordering)).

---

## Vite 8 Additions

### Object-style `entry` (Multi-page MPA)
Starting with Vite 8, the `entry` option accepts an object form for multi-page applications (MPA). Each key maps to the output HTML file name, and the value is the template file path:

```typescript
entry: {
  index: 'index.ejs',
  home: 'home.ejs'
}
```

This produces `dist/index.html` and `dist/home.html` after build.

### MPA + IIFE output requirement
When using MPA with IIFE output format, you must explicitly enable code splitting in the Vite config, otherwise Rolldown (Vite 8's bundler) throws an `INVALID_OPTION` error:

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

### Why default `enforce: 'pre'`
Vite 8 uses Rolldown as its bundler. For on-disk entry files, Rolldown skips the plugin chain's `resolveId` hook. Therefore vite-plugin-view must run in `'pre'` order to intercept template file resolution before Rolldown, rendering `.ejs`, `.pug`, etc. into HTML.

---

## Key Type References
- `LogLevel` from `vp-runtime-helper` package
- `InputOption` from `rollup` package
- `ResolvedConfig` from `vite` package

---

## TypeScript Type Definitions

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
   * Specify the template engine name
   */
  engine: SupportedTemplateEngines;

  /**
   * Specify the template engine entry files
   *
   * @default `index${extension}`
   */
  entry?: InputOption;

  /**
   * Specify the file extension to process, defaults to the engine name
   *
   * @default `.${engine}`
   */
  extension?: string;

  /**
   * Template engine configuration
   */
  engineOptions?: EngineOptions;

  /**
   * Force HTML beautification after rendering (some engines like Pug may not support this)
   */
  pretty?: boolean;

  /**
   * Output log level
   */
  logLevel?: LogLevel;

  /**
   * Whether to print the startup banner
   *
   * @default true
   */
  enableBanner?: boolean;

  /**
   * Plugin execution order: "pre" (before other plugins) or "post" (after).
   * Defaults to "pre" in Vite 8 because Rolldown skips resolveId for on-disk entries;
   * a "pre" plugin must intercept first.
   *
   * @default 'pre'
   */
  enforce?: 'pre' | 'post';
}
```
