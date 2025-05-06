# Configuration Options Reference

## Options Configuration Interface
Core configuration options for the plugin:

| Property          | Type                          | Description                                                                 | Default Value               |
|-------------------|-------------------------------|-----------------------------------------------------------------------------|-----------------------------|
| **engine**        | `SupportedTemplateEngines`    | **Mandatory** - Specify the template engine name.                           | -                           |
| entry             | `InputOption`                 | Entry file configuration for the template engine.                           | `index${extension}`         |
| extension         | `string`                      | File extension to process (defaults to the engine name if unspecified).      | `.${engine}`                |
| engineOptions     | `EngineOptions`               | Configuration options for the template engine.                              | -                           |
| pretty            | `boolean`                     | Force code beautification (some engines like Pug may not recommend this).   | `false`                     |
| logLevel          | `LogLevel`                    | Control log level output.                                                   | -                           |
| enforce           | `'pre' | 'post'`              | Plugin execution order control (follows Vite plugin ordering rules).         | -                           |

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
   * Plugin execution order: "pre" (before other plugins) or "post" (after)
   */
  enforce?: 'pre' | 'post';
}
```
