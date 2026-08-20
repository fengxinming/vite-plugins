
::: danger This is Vite 1.x – 6.x LEGACY documentation archive / 这是 Vite 1.x – 6.x 旧版文档归档
- These pages correspond to old plugin releases: **vite-plugin-view ≤ 4.x, vite-plugin-external ≤ 7.x, vite-plugin-build-chunk ≤ 4.x, etc.**
- Bundler covered: Rollup + esbuild (the default Vite 6 and below stack). **This does NOT apply to Vite 8+ with the new Rolldown bundler**; Vite 7/8+ users, go to the current docs immediately.
- Content under this folder is frozen and unmaintained. For any new option / field, check the current docs:
  - Latest English docs: [/guide/introduction](/guide/introduction)
  - 最新中文文档：[/zh/guide/introduction](/zh/guide/introduction)
:::
# Option Reference (legacy)


> Type definitions copied verbatim from the plugin TypeScript source:
>
```ts
/**
 * Reverse-lookup function for the global name of an external id.
 *
 * Typically the resolveHook built by setExternals — returns
 *   - string  → named external (e.g. 'react' → 'React')
 *   - true    → pure external (no global name)
 *   - false   → not external
 *
 * The 2nd/3rd args are optional so a single-arg `(id) => ...` resolver
 * (used by handleGlobals' default branch, which only needs the id) is
 * assignable to this type.
 *
 * 反查 external id → 全局变量名的函数。通常是 setExternals 构建的
 * resolveHook——返回 string 表示命名 external（react → React）；
 * 返回 true 表示纯 external；false 表示不是 external。
 * 2/3 参数可选，让 handleGlobals 默认分支里只用 id 的单参 resolver
 * 也能赋值给本类型。
 */
export type GlobalNameResolver = (
  id: string,
  importer?: string | undefined,
  isResolved?: boolean,
) => string | boolean | null | undefined | void;

/**
 * Return value helpers shared across the plugin decision-making pipeline.
 * Defined locally because Vite 8 dropped the direct rollup peer dep.
 *
 * 决策管线中所有返回值类型。本地定义是因为 Vite 8 不再直接依赖 rollup，
 * 我们也不想从 rolldown 里引这些底层类型。
 */
export type NullValue = null | undefined | void;

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
 *   - string → if an absolute URL → ESM CDN route; otherwise → IIFE global
 *             route (see makeCjsExternalCode / makeEsExternalCode).
 *             绝对 URL → ES CDN 重导出；否则 → IIFE 全局变量（写 CJS shim）。
 *   - falsy → not external; proceed to the next hook / normal resolution.
 *            不是 external，继续正常解析。
 */
export type ExternalFn = (
  source: string,
  importer: string | undefined,
  isResolved: boolean,
) => string | boolean | NullValue;

export type ModuleNameFn = ((id: string) => string);

/**
 * Globals resolver accepted by Rolldown output.globals (either static map
 * or a function deriving the name at runtime).
 *
 * Rolldown output.globals 接受的形态：对象是静态字典，函数是动态反查。
 */
export type ModuleNameMap = Record<string, string> | ModuleNameFn;

/**
 * A resolved stash entry for an IIFE-style global ({ react: React }).
 *
 * Design rationale：当用户写 react → React 时，我们不能只把 react 标
 * external，因为 dev（DepsOptimizer 预打包）和 build（走 stash 的路径）都
 * 需要一个**真实存在的 JS 文件**作为 import 的目标，否则产物里会残留裸引用
 * import "react"。所以我们写 stash 文件，内容是：
 *   module.exports = React;
 *
 * We cannot simply mark such a lib as external because:
 *   - Dev: DepsOptimizer pre-bundling needs a real file on disk to scan;
 *   - Build (non-IIFE): Rolldown produces a bare import "react" for
 *     pure-externals with no stash backing;
 *   - IIFE output: the global-name mapping is needed for output.globals
 *     reverse lookup (setOutputGlobals reads the name field via the
 *     populated globalObject map during setExternals).
 *
 * Fields：
 *   - name       ：global variable name（e.g. React），output.globals 反查用
 *   - external   ：bare import name（e.g. react），日志和 metadata 清理用
 *   - resolvedId ：stash 文件的绝对路径（= DepsOptimizer / Rolldown resolve 的目标）
 *   - format     ：iife 标签，和 ES 格式区分
 */
export interface ExternalIIFE {
  format: 'iife';
  name: string;
  external: string;
  resolvedId: string;
  link?: string;
}

/**
 * A resolved stash entry for an ESM-style CDN import
 * ({ react: https://esm.sh/react@18.3.1 }).
 *
 * 和 IIFE 全局变量的区别（Differences from IIFE）：
 *   1. Stash file is "export { default } from <link>; export * from <link>;"
 *      instead of a CJS shim. The browser itself loads the absolute ESM URL.
 *      stash 文件内容改为从 CDN 重导出，浏览器直接加载那个 ESM 模块。
 *   2. transformIndexHtml iterates stashMap and injects a
 *      <link rel="modulepreload" href="link"> so the browser starts
 *      prefetching the CDN module on first paint.
 *      dev/build 时注入 modulepreload，首屏就开始预取 CDN 模块。
 */
export interface ExternalES {
  format: 'es';
  external: string;
  resolvedId: string;
  link: string;
}

/**
 * Options that are valid for both the root Options and any per-mode
 * override (opts.development / opts.production).
 *
 * 设计背景（Design rationale）：
 * 多环境配置场景：开发环境 react → React（unpkg 的 umd），生产环境 react
 * → $linkdesign.React（自有 CDN）。为了让用户只覆盖 externals/cacheDir 等
 * 业务字段，不覆盖 enforce/enableBanner 这种插件级字段，将选项拆成两个接口。
 *
 * We split "field overrides per mode" from "global plugin options" so users
 * can write "development: { externals: {...} }" without accidentally
 * overriding enforce, enableBanner, or the build-time helpers.
 */
export interface BasicOptions {
  /**
   * External dependencies. 配置外部依赖。
   *
   * Five accepted shapes（五种输入形态）：
   *   1. Record<string, string>  —— {react:React} 或 {react:https://esm.sh/...}
   *   2. ExternalFn             —— (src, imp, resolved) => string|true|false
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
    | Record<string, string>;

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
}

/**
 * Full user-facing options shape.
 *
 * Notes：
 *   - The [mode: string] index signature accepts development /
 *     production / any custom mode as a BasicOptions override.
 *     索引签名允许 opts.development / opts.production 等特定模式字段
 *     （BasicOptions 覆盖）。
 *   - rollback 是历史遗留字段，Vite 8 合并为单一实现后已无实现。
 *     保留是因为公共配置发布过，用户可能仍写在 vite.config 里，空值不影响运行。
 *   - externalGlobals is the escape-hatch plugin for fixing Rolldown/Rollup
 *     Issue #3188 (IIFE top-level require not rewritten to a global).
 */
export interface Options {
  /**
   * External dependencies for specific mode
   * (e.g. development: { externals: { react: React } })
   *
   * 针对指定模式覆盖 BasicOptions 字段（例如开发模式用 unpkg 全局、生产模式用
   * 自有 CDN 全局变量前缀）。
   */
  [mode: string]: BasicOptions | any;

  /**
   * @deprecated No-op since the Vite 8 unification. Kept purely for
   * backward-compat with old vite.config files that still set it.
   *
   * 已废弃：Vite 8 版本将两套实现（alias + depsOptimizer）合并为单一的
   * DepsOptimizer + resolveId 路线，不再有"回退"分支。保留字段空壳只为兼容
   * 历史上写了 rollback: true 的 vite.config。
   */
  rollback?: boolean;

  /**
   * Interop escape hatch — preserved behaviour from pre-Vite-8 versions.
   *
   * 历史行为：当设置 interop: auto 时，build 阶段会**清空**
   * build.rolldownOptions.external，强制所有 external 通过 stash 文件路径
   * 走 resolveId 解析（而不是 Rolldown 原生 external 机制）。
   *
   * Historical behaviour preserved intact: if interop is auto the build
   * step clears build.rolldownOptions.external, forcing every external
   * to resolve through the stash-file path instead of Rolldown native
   * external flag.
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
   * Plugin enforce. External-related resolveId/load MUST run before generic
   * plugins — otherwise @vitejs/plugin-react or similar may resolve
   * react to node_modules/react before we get a chance to redirect it.
   * external.ts therefore defaults to enforce: pre. Users can still
   * override to post for edge cases.
   *
   * Vite 插件 enforce。external 的 resolveId/load 必须在普通插件之前执行，
   * 否则其他插件（比如 @vitejs/plugin-react）可能会先把 react 解析到
   * node_modules/react，本插件就没有机会重定向了。因此 external.ts 默认
   * enforce: pre，用户仍可显式改成 post 用于特殊场景。
   */
  enforce?: 'pre' | 'post';

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
   * them. Only active during command === build.
   *
   * 快捷开关：这些依赖（字符串或正则）一律不打包进产物。不提供全局名 / CDN shim，
   * 等价于对每个 dep 调用 externalHook.use 匹配命中即 true。只在 build 阶段生效。
   */
  externalizeDeps?: Array<string | RegExp>;

  /**
   * Fixes https://github.com/rollup/rollup/issues/3188
   *
   * Receives a resolver (id) => string | undefined that answers the same
   * question as Rolldown output.globals (lookup via the compiled
   * externals hooks above), and must return a Rolldown-compatible plugin
   * that rewrites top-level imports/requires to their equivalent global
   * accesses (window.React / globalThis.React).
   *
   * Typical usage: wrap @rolldown/plugin-external-globals (or its Rollup
   * ancestor). The produced plugin is prepended to rolldownOptions.plugins
   * so its transforms run **before** Rolldown own globals handling.
   *
   * 逃生舱：修复 Rolldown/Rollup Issue #3188（IIFE 输出时顶层 require/import
   * 没能被正确替换成 window.xxx 访问）。回调参数 globals(id) 可直接反查
   * 本插件 externals 的结果，等价于 Rolldown 原生 output.globals。返回值是
   * Rolldown 插件，会被放在 rolldownOptions.plugins 数组的**最前面**，这样
   * 它的 transform 先于 Rolldown 内置 globals 处理运行。
   */
  externalGlobals?: (globals: ModuleNameMap) => Rolldown.Plugin;

  /** Whether to print the plugin banner on startup. 启动时是否输出 banner 行。 */
  enableBanner?: boolean;
}

/**
 * Post-processed options carried through every downstream step.
 *
 * Produced by buildOptions() which: merges per-mode overrides, defaults
 * cwd/cacheDir, sets logger level, and spreads ConfigEnv (mode, command,
 * ssrBuild…) onto the result so downstream code never has to carry two
 * parameters around.
 *
 * 内部"最终版选项"形态。由 buildOptions() 生成：合并模式 override、补齐
 * cwd/cacheDir 默认值、设置日志级别、再把 ConfigEnv（mode、command 等）扩展
 * 字段一起挂上去。这样下游判断"现在是 build 还是 serve"不用再单独传 ConfigEnv。
 */
export interface ResolvedOptions {
  cwd: string;
  cacheDir: string;
}
```

## `externals`
* Type: `ExternalFn | boolean | string | RegExp | Array<string | RegExp> | Record<string, string>`
* Required: `false`

Configure external dependencies. [Example](/legacy/plugins/vite-plugin-external/usage#basic-usage)

## `logLevel`
* Type: `"TRACE" | "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL" | "OFF"`
* Required: `false`
* Default: `"WARN"`

Sets the logging level.

## `nodeBuiltins`
* Type: `boolean`
* Required: `false`

Whether to exclude Node.js built-in modules. [Example](/legacy/plugins/vite-plugin-external/usage#excluding-dependencies-during-build)

## `externalizeDeps`
* Type: `Array<string | RegExp>`
* Required: `false`

Specify dependencies to exclude from bundling. [Example](/legacy/plugins/vite-plugin-external/usage#excluding-dependencies-during-build)

## `externalGlobals`
* Type: `(globals: Record<string, any>) => rollup.Plugin`
* Required: `false`

Resolve IIFE Packaging Issues [Rollup Issue #3188](https://github.com/rollup/rollup/issues/3188). [Example](/legacy/plugins/vite-plugin-external/usage#solving-iife-build-issues)

## `rollback`
* Type: `boolean`
* Required: `false`

Whether to revert to the legacy implementation.

## `interop`
* Type: `"auto" | undefined`
* Required: `false`

This option controls how Vite adjust build strategies
. [Example](/legacy/plugins/vite-plugin-external/usage#adjusting-build-strategies)

## `enforce`
* Type: `'pre' | 'post'`
* Required: `false`

Enforce order. Values: `pre` (before) or `post` (after). Refer to [Vite Plugin Ordering](https://vite.dev/guide/api-plugin#plugin-ordering).

## `cwd`
* Type: `string`
* Required: `false`
* Default: `process.cwd()`

Sets the current directory for resolving `cacheDir` relative paths.

## `cacheDir`
* Type: `string`
* Required: `false`
* Default: `${cwd}/node_modules/.vite_external`

Cache directory path.

## `[mode: string]`
* Type: `BasicOptions`
* Required: `false`

Configure external dependencies for specific modes. [Example](/legacy/plugins/vite-plugin-external/usage#multi-mode-configuration)

---

## TypeScript Definitions

```typescript
import type { NullValue, Plugin as RollupPlugin } from 'rollup';
import type { ConfigEnv } from 'vite';
import type { LogLevel } from 'vp-runtime-helper';

export type ExternalFn = (
  source: string,
  importer: string | undefined,
  isResolved: boolean
) => string | boolean | NullValue;

export type ModuleNameMap = Record<string, string> | ((id: string) => string);

export type { LogLevel } from 'vp-runtime-helper';

export interface BasicOptions {
  /**
   * Current working directory for resolving `cacheDir` paths.
   * @default `process.cwd()`
   */
  cwd?: string;

  /**
   * Cache directory path
   * @default `${cwd}/node_modules/.vite_external`
   */
  cacheDir?: string;

  /**
   * External dependencies configuration
   */
  externals?:
    | ExternalFn
    | boolean
    | string
    | RegExp
    | Array<string | RegExp>
    | Record<string, string>;

  /**
   * Logging level configuration
   */
  logLevel?: LogLevel;
}

export interface Options extends BasicOptions {
  /**
   * Mode-specific external dependencies configuration
   */
  [mode: string]: BasicOptions | any;

  /**
   * Revert to legacy implementation
   */
  rollback?: boolean;

  /**
   * Controls Vite's default handling behavior
   */
  interop?: 'auto';

  /**
   * Plugin execution order ("pre" or "post")
   */
  enforce?: 'pre' | 'post';

  /**
   * Exclude Node.js built-in modules
   */
  nodeBuiltins?: boolean;

  /**
   * Dependencies to exclude from bundling
   */
  externalizeDeps?: Array<string | RegExp>;

  /**
   * Fix Rollup#3188 issue (https://github.com/rollup/rollup/issues/3188)
   */
  externalGlobals?: (globals: ModuleNameMap) => RollupPlugin;
}

export interface ResolvedOptions extends Options, ConfigEnv {
  cwd: string;
  cacheDir: string;
}
```
