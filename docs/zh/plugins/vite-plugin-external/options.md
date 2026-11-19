# 配置选项参考


> 以下公开类型定义镜像自插件源码（`src/types/deps.ts` 与 `src/types/options.ts`），仅内部使用的辅助类型已省略。
>
```ts
import type { ConfigEnv, Rolldown, UserConfig } from 'vite';
import type { LogLevel } from 'vp-runtime-helper';

/**
 * Return value helpers shared across the plugin decision-making pipeline.
 * Defined locally because Vite 8 dropped the direct rollup peer dep.
 *
 * 决策管线中所有返回值类型。本地定义是因为 Vite 8 不再直接依赖 rollup，
 * 我们也不想从 rolldown 里引这些底层类型。
 */
export type NullValue = null | undefined | void;

/**
 * ES 链接形态的导出模式。
 *
 * - auto   ：`import * as ns` + `export default ns.default` + `export *`，
 *            目标缺 default 时导出 undefined 而不是加载报错（默认值）。
 * - named  ：只 `export * from`，目标必须没有 default 时用这个。
 * - default：只 `export { default } from`。
 * - none   ：只 `import`，不导出（纯副作用导入）。
 */
export type ExternalEsExports = 'auto' | 'named' | 'default' | 'none';

/**
 * ES 链接形态的声明对象。url 的取值语义与字符串形态一致：有效绝对 URL，
 * 或以 /、./、../ 开头的有效 URL 字符串；./ ../ 写入 shim 时按 cwd 重定基。
 */
export interface ExternalEsConfig {
  format: 'es';
  url: string;
  exports?: ExternalEsExports;
}

export interface ResolveIdExtraOptions {
  kind?: Rolldown.ImportKind;
  custom?: Rolldown.CustomPluginOptions;
  ssr?: boolean | undefined;

  isEntry: boolean;
}

/**
 * The single signature that every "external decision" hook inside this plugin
 * compiles down to (see ExternalHook).
 *
 * 设计背景（Design rationale）：
 * 用户能用非常多的形态声明 externals（Record、function、string、RegExp、数组、
 * true …）。为了让 dev/build/pre-bundle 三处入口共享一套判断逻辑，我们把所有
 * 输入形态都"编译"为同签名函数（详见 ExternalHook）。后续主流程不再关心
 * 原始形态。
 *
 * All user-facing external shapes are normalised to this single signature so
 * every entry point (dev resolveId, build resolveId, DepsOptimizer
 * pre-bundling) shares the exact same decision logic — no divergence.
 *
 * 返回值语义（Return values）：
 *   - true  → import is external, **without** a global-name/URL mapping.
 *            Used by externalizeDeps and string/RegExp matches.
 *            标记为 external，但不提供替换规则（只不打包）。用于 externalizeDeps。
 *   - string (non-empty) → a URL → ESM route (see makeEsExternalCode), where a
 *             URL is a valid absolute URL or a valid URL string starting with
 *             /, ./ or ../; otherwise → IIFE global route (see makeCjsExternalCode).
 *             非空字符串：URL → ES 重导出（有效绝对 URL，或以 /、./、../ 开头的
 *             有效 URL 字符串）；否则 → IIFE 全局变量（写 CJS shim）。
 *   - ExternalEsConfig → the ES route above, with the export mode declared
 *             explicitly (auto / named / default / none) instead of guessed.
 *             显式声明的 ES 对象：可直接指定导出模式 exports。
 *   - falsy（含空字符串 ''）→ not external; proceed to the next hook / normal
 *             resolution. 不是 external，继续正常解析。
 */
export type ExternalFn = (
  id: string,
  parentId: string | undefined,
  isResolved: boolean | ResolveIdExtraOptions | Rolldown.ResolveIdExtraOptions
) => string | boolean | NullValue | ExternalEsConfig;

export type RolldownOptions = Rolldown.RolldownOptions;

/** Rolldown 的单个（非数组）输出选项。 */
export type RolldownOutputOptions = Exclude<RolldownOptions['output'], string | undefined | any[]>;

/** Rolldown 模块格式联合（`'es' | 'cjs' | 'iife' | ...`）。 */
export type ModuleFormat = Rolldown.ModuleFormat;


export type { LogLevel } from 'vp-runtime-helper';

/**
 * Options that are valid for both the root Options and any per-mode
 * override (opts.development / opts.production).
 *
 * 设计背景（Design rationale）：
 * 多环境配置场景：开发环境 react → React（unpkg 的 umd），生产环境 react
 * → $linkdesign.React（自有 CDN）。为了让用户按模式覆盖业务字段
 * （externals / externalizeDeps / nodeBuiltins / cacheDir / cwd / logLevel），
 * 不覆盖 enforce / enableBanner / interop / apply 这种插件级字段，将选项拆层。
 *
 * We split "field overrides per mode" from "global plugin options" so users
 * can write "development: { externals: {...} }" without accidentally
 * overriding interop, apply, enableBanner, or the build-time escape hatches
 * — those are consumed at plugin-factory time or are global behavioral
 * switches, so a per-mode override would either be impossible (apply /
 * enableBanner are read before the mode is known) or misleading.
 */
export interface BasicOptions {
  /**
   * External dependencies. 配置外部依赖。
   *
   * Five accepted shapes（五种输入形态）：
   *   1. Record<string, string | ExternalEsConfig>
   *                               —— {react:React}、{react:https://esm.sh/...}，
   *                                  或 ES 声明对象 {react:{format:'es',url:'https://esm.sh/react'}}
   *   2. ExternalFn             —— (src, imp, resolved) => string|true|false|ExternalEsConfig
   *                                必须同步函数；传 async 函数会在配置阶段直接 throw
   *                                （external/globals 判断都是同步边界）。
   *   3. string / RegExp        —— single match rule, hit → pure external
   *                                单条匹配规则，命中即 external（不给全局名）
   *   4. Array<string|RegExp>   —— multiple match rules
   *   5. true                   —— externalise *every* import (rare)
   *                                所有 import 都 external（极少用）
   */
  externals?:
    | ExternalFn
    | boolean
    | string
    | RegExp
    | Array<string | RegExp>
    | Record<string, string | ExternalEsConfig>;

  /** Log level. 输出日志等级。 */
  logLevel?: LogLevel;

  /**
   * CWD used when turning a relative cacheDir path absolute.
   * Defaults to process.cwd().
   *
   * 当前工作目录，用于把相对的 cacheDir 拼成绝对路径。
   * 默认 process.cwd()。
   */
  cwd?: string;

  /**
   * Folder for stash files. See ExternalIIFE / ExternalES for why a
   * real on-disk file is required per named external.
   * Defaults to ${cwd}/node_modules/.vite_external (kept next to Vite
   * own .vite cache for easy "rm -rf node_modules/.vite*" cleanup).
   *
   * stash 文件存放目录。每个"命名 external"（Record 形式）都会在里面写一个
   * JS shim。默认 ${cwd}/node_modules/.vite_external，紧邻 Vite 自带的
   * .vite 缓存，方便 rm -rf node_modules/.vite* 一键清理。
   */
  cacheDir?: string;

  /**
   * Shortcut: also treat Node built-ins (fs, path, node:stream/*…)
   * as external during command === build. No-op in dev because Node
   * built-ins never resolve in-browser anyway.
   *
   * 快捷开关：把所有 Node.js 内置模块（fs、path、node:stream 等）也作为
   * external。只在 build 阶段生效（dev 阶段浏览器里 Node 内置模块本来就不会
   * 被 resolve，没必要多此一举）。
   */
  nodeBuiltins?: boolean;

  /**
   * Shortcut: treat these libraries (strings or regexes) as pure externals
   * — they are not bundled, but no global-name / CDN shim is provided for
   * them. Active in both dev and build.
   *
   * 快捷开关：这些依赖（字符串或正则）一律不打包。不提供全局名 / CDN shim，
   * 等价于对每个 dep 调用 externalHook.use，命中即 true；dev 与 build 都生效。
   * dev 下 vite 会把这类裸说明符改写成 `/@id/<说明符>`（实测：`external: true`
   * 与 `external: 'absolute'` 两种写法结果相同），运行时地址由使用方自己兜 ——
   * 浏览器侧就是 `<script type="importmap">`，Node 侧由宿主解析。
   */
  externalizeDeps?: Array<string | RegExp>;
}

/**
 * Per-mode override blocks. The four common Vite modes are declared
 * explicitly so they get full type-checking and IDE completion; any
 * custom mode (--mode staging, --mode alpha…) falls through to the
 * string index signature, which is intentionally `unknown` rather
 * than `BasicOptions | any`:
 *
 *   - `BasicOptions` would violate TS2411 (root-level fields like
 *     `externals: string | RegExp | …` are not assignable to it).
 *   - `any` (the old hack) silently accepted *anything* — a typo or a
 *     plugin-level field in a mode block was swallowed without a word.
 *   - `unknown` satisfies TS2411 (everything is assignable to unknown)
 *     while runtime buildOptions() warns when it meets a key that is
 *     not part of BasicOptions.
 *
 * 按模式覆盖的配置块。四个常用 Vite 模式显式声明，获得完整的类型检查与
 * IDE 补全；自定义模式（--mode staging 等）落入 string 索引签名兜底。
 * 索引值类型故意用 unknown 而不是 BasicOptions | any：
 *   - BasicOptions 会触发 TS2411（根级 externals 等字段类型不兼容）。
 *   - any（旧临时方案）什么都收，mode 块里写错字段会被静默吞掉。
 *   - unknown 既满足 TS2411，运行时 buildOptions 又会对非 BasicOptions
 *     字段打 warn 提示。
 */
export interface ModeOptions {
  /** Custom modes fall through here. 自定义模式兜底。 */
  [mode: string]: unknown;

  development?: BasicOptions;
  production?: BasicOptions;
  test?: BasicOptions;
  staging?: BasicOptions;
}

/**
 * Full user-facing options shape.
 *
 * 完整的用户配置形态。
 * 注意：Options 必须以「接口继承 BasicOptions + ModeOptions」的方式组合，
 * 不能改成 BasicOptions & ModeOptions 交叉类型——交叉会把 ModeOptions 的
 * 索引签名叠加到根级字段上，导致 externals: {react: 'React'} 这类对象字面量
 * 被误判为多余属性而报错。
 */
export interface Options extends BasicOptions, ModeOptions {
  /**
   * Interop escape hatch — preserved behaviour from pre-Vite-8 versions.
   *
   * 历史行为：当设置 interop: auto 时，build 阶段的 config 钩子会声明式覆盖
   * build.rolldownOptions.external 为恒 false（不在用户对象上就地清空），
   * 强制所有 external 通过 stash 文件路径走 resolveId 解析（而不是 Rolldown 原生 external 机制）。
   *
   * Historical behaviour preserved: if interop is auto the build config hook
   * declaratively overrides build.rolldownOptions.external with an always-false
   * function (without clearing it in place on the user object), forcing every external
   * to resolve through the stash-file path instead of Rolldown native external flag.
   *
   * Why this exists：
   * 原场景是 IIFE 构建时某些库被 output.globals 处理后仍生成错误的 require
   * 包装。解决方法是"构建阶段也当成 shim 打包"，让 Rolldown 把它当作普通依赖
   * bundle 进去，shim 只有一行 module.exports = React; Rolldown 的 IIFE
   * 包装就能正确处理。
   *
   * The original IIFE scenario: for some libraries, marking them as
   * external + relying on output.globals still wrapped the top-level
   * require incorrectly. Using stash files instead makes Rolldown treat
   * the lib as a normal in-bundle dependency, and the 1-line CJS shim
   * (module.exports = React;) is a shape that Rolldown IIFE output has
   * always been able to wrap correctly.
   */
  interop?: 'auto';

  /**
   * Emit the URL-valued entries of `externals` as an import map in the build
   * HTML instead of pointing the bundle at the CDN URL directly.
   *
   * Build only: dev still resolves CDN externals through the DepsOptimizer and
   * keeps no import map. The stash files are still written — the switch only
   * changes what build resolveId returns and what transformIndexHtml injects.
   *
   * 只在 build 阶段生效。dev 仍由 DepsOptimizer 把 CDN external 预打包成本地
   * deps 模块，页面不会得到导入映射表。build 阶段 `resolveId` 对 ES 形态条目返回
   * `{ id: '<说明符>', external: 'absolute' }`，产物保留裸 import；
   * `transformIndexHtml` 注入以裸说明符为键的
   * `<script type="importmap">{"imports":{…}}</script>`，并为每个 URL 附一条
   * `<link rel="modulepreload" crossorigin>`。
   *
   * stash 文件照常写入（dev 预打包与标签名单都依赖它），开关不改写盘行为。
   * 任意能解析出 ES URL 的 externals 形态都适用；纯 external（返回 true）不产生条目，
   * 全局名条目仍走 IIFE stash。插件级开关，不能按模式覆盖。
   */
  importmap?: boolean;

  /**
   * Plugin enforce. Applies to the config plugin — the one that installs the
   * external decision into build.rolldownOptions.external / output.globals —
   * so it can run after other plugins that mutate the user config
   * (default 'post'). The resolve plugin is pinned to 'pre' and is NOT
   * affected by this option: external decisions must beat generic resolvers
   * (@vitejs/plugin-react or similar may otherwise resolve react to
   * node_modules/react before we get a chance to redirect it).
   *
   * Read at plugin-factory time (before the config hook runs), so it is a
   * plugin-level field and cannot be overridden per mode.
   *
   * Vite 插件 enforce。只作用于 config 插件（负责改写 rolldownOptions.external /
   * output.globals 的那个），缺省 'post'，保证它在其他修改用户配置的插件之后执行。
   * 解析插件固定为 'pre'，不受本选项影响：external 判定必须先于通用解析器，
   * 否则 @vitejs/plugin-react 之类的插件可能先把 react 解析到 node_modules/react。
   * 它在插件工厂阶段读取（config 钩子之前），因此是插件级字段，不能按模式覆盖。
   *
   * @default 'post'
   */
  enforce?: 'pre' | 'post';

  /**
   * Apply the plugin only for serve or build, or on certain conditions.
   *
   * @see https://vitejs.dev/guide/api-plugin.html#apply
   *
   * Read at plugin-factory time (before the config hook runs), so it is a
   * plugin-level field and cannot be overridden per mode.
   *
   * 仅在 serve 或 build 阶段生效，或在满足条件时生效。
   * 在插件工厂阶段读取（config 钩子之前），因此是插件级字段，不能按模式覆盖。
   *
   * @default (config, env) => !env.isPreview
   */
  apply?:
    | 'serve'
    | 'build'
    | ((this: void, config: UserConfig, env: ConfigEnv) => boolean);

  /** Whether to print the plugin banner on startup. 启动时是否输出 banner 行。 */
  enableBanner?: boolean;
}

/**
 * 内部"最终版选项"形态，由 buildOptions() 生成后透传给所有下游步骤。
 *
 * buildOptions() 的处理包括：合并模式 override、补齐 cwd/cacheDir 默认值、
 * 设置日志级别、再把 ConfigEnv 字段（mode、command 等）一起挂上去。
 * 这样下游判断"现在是 build 还是 serve"时，不需要再单独拿 ConfigEnv 参数。
 */
export interface ResolvedOptions extends Options, ConfigEnv {
  cwd: string;
  cacheDir: string;
}
```

## ExternalFn 类型
* 声明形态：`(source: string, importer: string | undefined, isResolved: boolean | ResolveIdExtraOptions | Rolldown.ResolveIdExtraOptions) => string | boolean | NullValue | ExternalEsConfig`

**归一化决策签名（Decision hook）**：用户写的 `externals`（对象、函数、字符串、正则、数组、`true`）在内部都会先被统一转成这个签名的函数，然后在「开发预打包 / dev 中间件 / build」三个入口处共享完全相同的决策逻辑。返回值语义：
- `string`（URL：有效绝对 URL，或以 `/`、`./`、`../` 开头的有效 URL 字符串）→ 走 ES 链接重导出；
- `string`（其它）→ 走 IIFE 全局变量名；
- `ExternalEsConfig`（`{ format: 'es', url, exports? }`）→ 走 ES 链接重导出；`exports` 缺省 `'auto'`（命名空间取 default 再 `export *`，目标缺 default 时得到 `undefined` 而不是加载报错），可选 `'named'`（只 `export *`）/ `'default'`（只转发 default）/ `'none'`（纯副作用导入）；
- `true` → 纯 external（只不打包，不提供替换规则）；
- falsy → 不是 external，继续正常解析。

实际使用时直接写 `externals` 字段即可（对象/函数/正则等五种形态，见 [externals](#externals) 或 [使用示例：基础使用](/zh/plugins/vite-plugin-external/usage#基础使用)），本插件会自动做归一化。

## `externals`
* 类型：`ExternalFn | boolean | string | RegExp | Array<string | RegExp> | Record<string, string | ExternalEsConfig>`
* 必填：`false`

配置外部依赖项。[示例](/zh/plugins/vite-plugin-external/usage#基础使用)

## `logLevel`
* 类型：`LogLevel`（`Level` 数值枚举 OFF=0…TRACE=6，或 `"TRACE" | "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL" | "OFF"` 字符串）
* 必填：`false`
* 默认值：`"WARN"`

设置日志级别。

## `enableBanner`
* 类型：`boolean`
* 必填：`false`
* 默认值：`false`

是否输出启动 banner。仅显式设为 `true` 时才输出。

## `nodeBuiltins`
* 类型：`boolean`
* 必填：`false`

是否排除 Node.js 内置模块。仅 build 阶段生效。支持按模式覆盖（见 [`[mode: string]`](#mode-string-索引签名)）。[示例](/zh/plugins/vite-plugin-external/usage#构建时仅排除依赖)

## `externalizeDeps`
* 类型：`Array<string | RegExp>`
* 必填：`false`

指定需要排除的打包依赖项。dev 与 build 都生效；命中的依赖是**纯 external**，不写任何替换：build 产物保留裸 import，dev 下 Vite 会把它改写成 `/@id/<说明符>`，浏览器只有页面带上以该前缀为键的 `{"imports": …}` 表才取得到模块（[示例](/zh/plugins/vite-plugin-external/usage#构建时仅排除依赖)；这张表由你自己提供，插件只在 build 且 `importmap: true` 时才注入映射，见[用导入映射替代 CDN 地址](/zh/plugins/vite-plugin-external/usage#用导入映射替代-cdn-地址)）。支持按模式覆盖（见 [`[mode: string]`](#mode-string-索引签名)）。

## `importmap`
* 类型：`boolean`
* 必填：`false`
* 默认值：`false`

**仅 build 阶段生效。** build 时，`externals` 里解析为 ES URL 的条目在产物中保留裸说明符：`resolveId` 返回 `{ id: '<说明符>', external: 'absolute' }`；`transformIndexHtml` 注入 `<script type="importmap">{"imports": {…}}</script>`（键就是裸说明符），并为每个 URL 注入一条 `<link rel="modulepreload" crossorigin>`，由浏览器把裸说明符解析到 CDN。

stash 文件仍然照写 —— 开关只改 build 的解析目标与 HTML 内容。dev 不受影响：CDN external 仍由 DepsOptimizer 预打包，dev 页面既没有表也没有预取标签。

任意能解析出 ES URL 的 `externals` 形态都适用（URL 字符串或 `{ format: 'es', … }` 对象）；纯 external（返回 `true`）不会进表，值为全局变量名的条目仍走 IIFE stash。

它是插件级开关，与 `interop` / `apply` / `enableBanner` 同级，不支持按模式覆盖。[示例](/zh/plugins/vite-plugin-external/usage#用导入映射替代-cdn-地址)

## `interop`
* 类型：`"auto" | undefined`
* 必填：`false`

控制 Vite 的默认构建策略调整。[示例](/zh/plugins/vite-plugin-external/usage#调整打包策略)

## `enforce`
* 类型：`'pre' | 'post'`
* 必填：`false`
* 默认值：`'post'`

设置 **config 插件**（负责把 external 判定写进 `build.rolldownOptions.external` / `output.globals` 的那个）的 `enforce`，因此缺省在其他修改用户配置的插件之后执行。解析插件固定为 `'pre'`，不受本选项影响：external 判定必须先于通用解析器，否则 @vitejs/plugin-react 之类的插件可能先把 `react` 解析到 `node_modules/react`。

它在插件工厂阶段读取（`config` 钩子之前），因此是插件级字段，不能按模式覆盖。

## `apply`
* 类型：`'serve' | 'build' | ((this: void, config: UserConfig, env: ConfigEnv) => boolean)`
* 必填：`false`
* 默认值：`(config, env) => !env.isPreview`

仅在 serve 或 build 阶段启用插件，或在满足条件时启用。参考 [Vite 插件 apply](https://cn.vitejs.dev/guide/api-plugin.html#apply)。

它在插件工厂阶段读取（`config` 钩子之前），因此是插件级字段，不能按模式覆盖。

## `cwd`
* 类型：`string`
* 必填：`false`
* 默认值：`process.cwd()`

设置解析 `cacheDir` 相对路径时的当前工作目录。

## `cacheDir`
* 类型：`string`
* 必填：`false`
* 默认值：`${cwd}/node_modules/.vite_external`

缓存目录路径。

相对路径以 `cwd` 为基准解析（不是 `process.cwd()`），传绝对路径则原样使用。

## `[mode: string]` 索引签名
* 类型：`ModeOptions` —— `development` / `production` / `test` / `staging` 显式声明为 `BasicOptions`；其它自定义模式落入 `unknown` 索引签名兜底
* 必填：`false`

按模式覆盖 `BasicOptions` 字段（`externals` / `logLevel` / `cwd` / `cacheDir` / `nodeBuiltins` / `externalizeDeps`）。插件级字段（`interop` / `importmap` / `enforce` / `apply` / `enableBanner`）刻意不可按模式覆盖；模式块里出现非 `BasicOptions` 字段时运行时会打 warn 并丢弃该字段。[示例](/zh/plugins/vite-plugin-external/usage#多模式场景配置)

## 入口导出

除上述配置类型外，包入口还对外暴露以下运行时值：

```ts
// 默认导出 — 插件工厂（本地名可任意）。
import pluginExternal from 'vite-plugin-external';

// 具名入口导出：
import { vitePluginExternal, ExternalError, cleanupCache } from 'vite-plugin-external';
```

| 导出 | 签名 | 说明 |
|------|------|------|
| 默认导出 / `vitePluginExternal` | `(opts?: Options) => Plugin[]` | 插件工厂函数。`vitePluginExternal` 是默认导出的具名形式。 |
| `ExternalError` | `class ExternalError extends Error` — `constructor(msg: string, opts?: ErrorOptions)` | 插件抛出的错误，消息带 `[<插件名>]` 前缀。 |
| `cleanupCache` | `(deps: string[], config: ResolvedConfig) => void` | 从 Vite 预构建依赖缓存的 `_metadata.json` 中删去指定 `deps` 的 `optimized` 条目（仅改名单，不删磁盘上的缓存文件）；当 `config.command === 'build' && config.build.ssr` 时单独读取 SSR 缓存目录。 |

