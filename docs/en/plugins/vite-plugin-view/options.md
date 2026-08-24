# Configuration Options Reference


> Type definitions copied verbatim from the plugin TypeScript source:
>
```ts
import type { InputOption } from 'rolldown';
import type { ConfigEnv, ResolvedConfig, UserConfig } from 'vite';
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
  | ((config: ResolvedConfig) => Record<string, any> | null | undefined);

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

  /**
   * Apply the plugin only for serve or build, or on certain conditions.
   *
   * 只在 serve 或 build 时生效，或者某些条件。
   */
  apply?:
    | 'serve'
    | 'build'
    | ((this: void, config: UserConfig, env: ConfigEnv) => boolean);

  /**
   * Strategy configuration covering both the dev server and the build phase.
   *
   * - `dev` controls how the dev server handles template requests.
   * - `build` controls what the build phase outputs.
   *
   * 覆盖开发服务器与构建阶段的策略配置。
   *
   * - `dev` 控制开发服务器如何处理模板请求。
   * - `build` 控制构建阶段输出什么产物。
   *
   * @default `{ dev: 'intercept', build: 'html' }`
   */
  strategy?: {
    /**
     * Dev server request handling strategy.
     *
     * - `'intercept'` — render template in memory, apply
     *   `transformIndexHtml`, and send the response directly.
     * - `'delegate'`  — render template to a sibling `.html` file on disk,
     *   back up any pre-existing `.html` to `.bak_<timestamp>`, then call
     *   `next()` so Vite's native HTML pipeline handles the URL end-to-end.
     *   Backups are restored and generated files are cleaned up on process
     *   exit (SIGINT / SIGTERM / uncaught exceptions).
     *
     * 开发服务器请求处理策略。
     *
     * - `'intercept'` — 内存渲染模板，调用 `transformIndexHtml` 后直接返回响应。
     * - `'delegate'`  — 将模板渲染为同目录下的 `.html` 磁盘文件，
     *   已存在的 `.html` 先备份为 `.bak_<时间戳>`，再 `next()` 交给
     *   Vite 原生 HTML 流水线端到端处理。进程退出时自动还原备份。
     *
     * @default `'intercept'`
     */
    dev?: 'intercept' | 'delegate';

    /**
     * Build output strategy.
     *
     * - `'html'`      — compile templates to `.html` files (current behavior).
     * - `'template'`  — keep original template syntax (e.g. EJS `<%= title %>`,
     *   `#{variable}`), inject generated `<script>` / `<link>` asset tags
     *   into the template source, and output the template file (`.ejs` /
     *   `.pug` / …) to `dist`. No `.html` is produced.
     * - `'both'`      — output both the compiled `.html` and the template
     *   file with injected asset tags.
     *
     * 构建产出策略。
     *
     * - `'html'`      — 将模板编译为 `.html` 文件（现有行为）。
     * - `'template'`  — 保留原始模板语法（如 `<%= title %>`、`#{variable}`），
     *   将生成的 `<script>` / `<link>` 资源标签注入模板源码，
     *   输出模板文件（`.ejs` / `.pug` / …）到 `dist`。不产出 `.html`。
     * - `'both'`      — 同时产出编译后的 `.html` 和注入了资源标签的模板文件。
     *
     * @default `'html'`
     */
    build?: 'html' | 'template' | 'both';
  };

  /**
   * Placeholder string in the template that will be replaced with generated
   * `<script>` and `<link>` asset tags during build (only effective when
   * `strategy.build` is `'template'` or `'both'`).
   *
   * If specified, the plugin searches for this exact string in the template
   * source and replaces the first occurrence with the asset tags. If the
   * placeholder is not found, or if this option is omitted, asset tags are
   * injected before `</head>` (matching Vite's native `injectToHead` behavior).
   *
   * 构建时模板中的占位符字符串，插件会将其替换为生成的
   * `<script>` 和 `<link>` 资源标签（仅在 `strategy.build` 为
   * `'template'` 或 `'both'` 时生效）。
   *
   * 指定后，插件在模板源码中搜索该字符串，将首个匹配处替换为资源标签。
   * 如果未找到占位符或未指定此选项，资源标签注入到 `</head>` 前
   * （与 Vite 原生 `injectToHead` 行为一致）。
   *
   * @default undefined (inject before `</head>`)
   */
  injectPlaceholder?: string;
}

/**
 * Shared record type for `.html` files emitted by the `delegate` strategy.
 * Owned by `index.ts` (module scope) so the plugin can hand it to the
 * middleware when appropriate.
 *
 *   key   = clean URL (e.g. "/home")
 *   value = {
 *     htmlPath — absolute path of the emitted `.html` file
 *     bakPath  — absolute path of the backup if an existing file was renamed,
 *                null if no backup was needed
 *   }
 *
 * `delegate` 策略写入的 `.html` 文件记录的共享类型。
 * 归 `index.ts`（模块作用域）所有，由插件按需传给中间件。
 *
 *   key   = 干净 URL（如 "/home"）
 *   value = {
 *     htmlPath — 写入的 `.html` 文件绝对路径
 *     bakPath  — 如果原文件被重命名备份，记录备份的绝对路径；
 *                无需备份则为 null
 *   }
 */
export type DelegateWrittenMap = Map<string, { htmlPath: string, bakPath: string | null }>;
```

## Options Configuration Interface
Core configuration options for the plugin:

| Property              | Type                                                                       | Description                                                                                                                                       | Default Value                                |
|-----------------------|----------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------|
| **engine**            | `SupportedTemplateEngines`                                                 | **Mandatory** - Specify the template engine name.                                                                                                 | -                                            |
| entry                 | `InputOption`                                                              | Entry file configuration. Vite 8+ accepts objects like `{ index: 'index.ejs', home: 'home.ejs' }` for multi-page MPA.                             | `index${extension}`                          |
| extension             | `string`                                                                   | File extension to process (defaults to the engine name if unspecified).                                                                           | `.${engine}`                                 |
| engineOptions         | `EngineOptions`                                                            | Configuration options for the template engine.                                                                                                    | -                                            |
| pretty                | `boolean`                                                                  | Force code beautification (some engines like Pug may not recommend this).                                                                         | `false`                                      |
| logLevel              | `LogLevel`                                                                 | Control log level output.                                                                                                                         | -                                            |
| enableBanner          | `boolean`                                                                  | Whether to print the startup banner.                                                                                                              | `true`                                       |
| enforce               | `'pre' \| 'post'`                                                           | Plugin execution order. Vite 8 defaults to `'pre'` because Rolldown skips resolveId for on-disk entries.                                          | `'pre'` (Vite 8)                             |
| strategy              | `{ dev?: 'intercept' \| 'delegate'; build?: 'html' \| 'template' \| 'both' }` | Dev + build strategy object. `dev` controls dev-server request handling; `build` controls whether build emits `.html`, original templates, or both. | `{ dev: 'intercept', build: 'html' }`        |
| injectPlaceholder     | `string`                                                                   | Build-time placeholder for asset-tag injection (only with `strategy.build` of `'template'` or `'both'`). Falls back to closing head tag injection.              | `undefined`                                  |

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
  | ((config: ResolvedConfig) => Record<string, any> | null | undefined);
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

### `strategy` — Dev + Build strategy object (`{ dev, build }`)
Starting with Vite 8, `strategy` becomes an object that controls the dev-server request handling **and** the build output shape independently:

```typescript
strategy?: {
  dev?:   'intercept' | 'delegate';     // dev-server request handling
  build?: 'html' | 'template' | 'both'; // build output strategy
}
```

#### `strategy.dev` — Dev server request handling
- **`'intercept'` (default)**: the plugin renders the template in memory, applies `transformIndexHtml`, and sends the response directly to the client. No temporary `.html` file is written to disk. Suitable for standard day-to-day development.
- **`'delegate'`**: the plugin renders the template to a sibling `.html` file next to the source template, then calls `next()` so Vite's native HTML middleware stack takes over the same URL end-to-end. Any pre-existing `.html` at that path is backed up to `.bak_<timestamp>` first; backups are restored and generated files are removed when the dev process exits (SIGINT / SIGTERM / uncaught exceptions).

#### `strategy.build` — Build output strategy
- **`'html'` (default)**: compiles templates into `.html` files and emits them to `dist` (identical to legacy behavior).
- **`'template'`**: **does NOT compile templates**. Preserves original template syntax (e.g. EJS `<%= title %>`, Pug `#{variable}`), injects the Vite-generated `script[type=module][crossorigin]` / `link[rel=stylesheet][crossorigin]` asset tags into the template source, and outputs the raw template files (`.ejs` / `.pug` / …) to `dist`. No `.html` files are produced. Useful when a Node backend will re-render the templates at runtime with dynamic data.
- **`'both'`**: emits **both** the compiled `.html` files **and** the original template files with injected asset tags.

#### `injectPlaceholder` — Build injection placeholder (only used with `strategy.build` of `'template'` or `'both'`)
When a template's structure makes it awkward to inject tags right before the closing head tag, place a custom placeholder string (e.g. `<!-- VITE_ASSETS -->`) in the template and pass it via `injectPlaceholder`. The plugin replaces the first match with the generated asset tags. If the placeholder is not found in the template, or if `injectPlaceholder` is omitted, tags fall back to injection before the closing head tag (matching Vite's native `injectToHead` behavior).

#### Example: `dev: 'delegate'` + `build: 'template'`

```typescript
view({
  engine: 'ejs',
  extension: '.ejs',
  strategy: {
    dev:   'delegate',
    build: 'template'
  },
  injectPlaceholder: '<!-- VITE_ASSETS -->',
  entry: {
    index: 'index.ejs',
    home:  'home.ejs',
  },
  engineOptions: {
    title: 'EJS Delegate + Build Template Example',
    items: ['Alpha', 'Beta', 'Gamma'],
    pageTitle: 'Home (delegate + template)',
  },
})
```

**Dev phase**: a request to `/` writes a sibling `index.html` in the project root (the user's pre-existing `index.html` is archived to `index.html.bak_<timestamp>`), and a request to `/home` writes `home.html`. Both are then processed end-to-end through Vite's native `htmlFallbackMiddleware` → `indexHtmlMiddleware` → `transformIndexHtml` pipeline.

**Build phase**: emits `dist/index.ejs` and `dist/home.ejs` with EJS syntax preserved and built JS/CSS asset tags injected at the placeholder (or before the closing head tag). A Node backend can consume these `.ejs` files and re-render them with dynamic data (user info, i18n, etc.).

---

## Key Type References
- `LogLevel` from `vp-runtime-helper` package
- `InputOption` from `rolldown` package
- `ResolvedConfig` from `vite` package
