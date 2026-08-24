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
     * - `'template'`  — keep original template syntax (e.g. `<%= title %>`,
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
```

## Options 配置接口
插件核心配置选项：

| 属性名              | 类型                                                     | 描述                                                                                               | 默认值                               |
|-------------------|---------------------------------------------------------|---------------------------------------------------------------------------------------------------|--------------------------------------|
| **engine**        | `SupportedTemplateEngines`                              | 必填项，指定模板引擎名称                                                                              | -                                    |
| entry             | `InputOption`                                           | 模板引擎入口文件配置，Vite 8 起支持对象形式 `{ index: 'index.ejs', home: 'home.ejs' }` 用于多页面 MPA        | `index${extension}`                  |
| extension         | `string`                                                | 需要处理的文件扩展名，默认与引擎名称一致                                                                 | `.${engine}`                         |
| engineOptions     | `EngineOptions`                                         | 模板引擎配置选项                                                                                     | -                                    |
| pretty            | `boolean`                                               | 强制美化代码输出（部分引擎不建议渲染时美化）                                                              | `false`                              |
| logLevel          | `LogLevel`                                              | 日志等级控制                                                                                        | -                                    |
| enableBanner      | `boolean`                                               | 是否输出启动 banner                                                                                 | `true`                               |
| enforce           | `'pre' | 'post'`                                        | 插件执行顺序控制（参考 Vite 插件排序规则）。Vite 8 默认 `'pre'`，因为 Rolldown 会跳过磁盘入口的 resolveId，必须前置拦截 | `'pre'`（Vite 8）                     |
| strategy          | `{ dev?: 'intercept' \| 'delegate'; build?: 'html' \| 'template' \| 'both' }` | 开发 + 构建阶段策略对象。`dev` 控制 dev server 请求处理方式；`build` 控制构建产出 `.html` / 原始模板 / 两者 | `{ dev: 'intercept', build: 'html' }` |
| injectPlaceholder | `string`                                                | 构建时模板中注入资源标签的占位符，仅在 `strategy.build` 为 `'template'` 或 `'both'` 时生效。不指定则注入到 `</head>` 前 | `undefined`                          |

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

### `strategy` — 开发 + 构建策略对象（`{ dev, build }`）
Vite 8 起 `strategy` 改为对象形式，独立控制开发服务器行为和构建产出形态：

```typescript
strategy?: {
  dev?:   'intercept' | 'delegate';     // 开发服务器请求处理策略
  build?: 'html' | 'template' | 'both'; // 构建阶段输出策略
}
```

#### `strategy.dev` — 开发服务器请求处理
- **`'intercept'`（默认）**：插件在内存中渲染模板，应用 `transformIndexHtml` 后直接返回响应。不会向磁盘写入任何临时 `.html` 文件，适合日常开发场景。
- **`'delegate'`**：插件将模板渲染为模板同目录下的 `.html` 磁盘文件，再调用 `next()` 交由 Vite 原生 HTML 流水线端到端地处理同一 URL。已存在的 `.html` 文件会先备份为 `.bak_<时间戳>`，进程结束（SIGINT / SIGTERM / 未捕获异常）时自动还原备份并删除生成的文件。

#### `strategy.build` — 构建产出策略
- **`'html'`（默认）**：将模板编译为 `.html` 文件并输出到 `dist`（与之前版本行为一致）。
- **`'template'`**：**不编译模板**。保留原始模板语法（如 EJS 的 `<%= title %>`、Pug 的 `#{variable}`），将 Vite 构建生成的 `<script type="module" crossorigin>` / `<link rel="stylesheet" crossorigin>` 资源标签注入模板源码，输出模板文件（`.ejs` / `.pug` 等）到 `dist`。不产出 `.html`。适用于 Node 后端在运行时用动态数据二次渲染模板的场景。
- **`'both'`**：同时产出编译后的 `.html` 和注入了资源标签的原始模板文件。

#### `injectPlaceholder` — 构建注入占位符（仅配合 `strategy.build: 'template' | 'both'` 使用）
如果模板中不方便在 `</head>` 前注入标签（例如模板结构特殊），可以在模板中放置一个自定义占位符字符串（如 `<!-- VITE_ASSETS -->`）并通过 `injectPlaceholder` 传入，插件会将首个占位符替换为生成的资源标签。若未找到占位符或未指定此选项，标签仍然注入到 `</head>` 前（与 Vite 原生 `injectToHead` 行为一致）。

#### 配置示例：`dev: 'delegate'` + `build: 'template'`

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

**开发阶段**：访问 `/` 会在项目根目录生成 `index.html`（用户原有的 `index.html` 被备份为 `index.html.bak_<时间戳>`），访问 `/home` 会生成 `home.html`，两者都经 Vite 原生的 `htmlFallbackMiddleware` → `indexHtmlMiddleware` → `transformIndexHtml` 流水线处理。

**构建阶段**：输出 `dist/index.ejs` 和 `dist/home.ejs`，保留 EJS 语法，并在占位符位置（或 `</head>` 前）注入构建后的 JS/CSS 资源标签。Node 后端拿到这些文件后可以传入动态数据（如用户信息、i18n）再次渲染。

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
     * - `'template'`  — keep original template syntax (e.g. `<%= title %>`,
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
```
