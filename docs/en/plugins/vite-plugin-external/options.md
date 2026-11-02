# Option Reference


> Type definitions copied verbatim from the plugin TypeScript source (`src/types.ts`, plus `ResolvedOptions` from `src/internal-types.ts`):
>
```ts
import type { ConfigEnv, UserConfig } from 'vite';
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
 *   - string (non-empty) → an absolute URL → ESM CDN route; otherwise → IIFE
 *             global route (see makeCjsExternalCode / makeEsExternalCode).
 *             非空字符串：绝对 URL → ES CDN 重导出；否则 → IIFE 全局变量（写 CJS shim）。
 *   - falsy（含空字符串 ''）→ not external; proceed to the next hook / normal
 *             resolution. 不是 external，继续正常解析。
 */
export type ExternalFn = (
  source: string,
  importer: string | undefined,
  isResolved: boolean,
) => string | boolean | NullValue;

export type RolldownOptions = NonNullable<NonNullable<UserConfig['build']>['rolldownOptions']>;


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
   *   1. Record<string, string>  —— {react:React} 或 {react:https://esm.sh/...}
   *   2. ExternalFn             —— (src, imp, resolved) => string|true|false
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
   * Apply the plugin only for serve or build, or on certain conditions.
   *
   * @see https://vitejs.dev/guide/api-plugin.html#apply
   *
   * 仅在 serve 或 build 阶段生效，或在满足条件时生效。
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

## ExternalFn Type
* Signature: `(source: string, importer: string | undefined, isResolved: boolean) => string | boolean | NullValue`

The **normalised decision hook** signature. Every user-facing external shape (object map / function / string / RegExp / array / `true`) is compiled down to a single function with this signature before it reaches any of the three pipeline entry points (DepsOptimizer pre-bundling / dev middleware / build), so all three share the exact same decision logic — no more phase drift.

Return-value contract:
- `string` (absolute URL) → re-export from an ES CDN URL;
- `string` (not absolute) → IIFE global variable name;
- `true` → pure external (exclude from the bundle, no replacement rule);
- falsy → not external; proceed with normal resolution.

As an end user you should just use the `externals` field with one of the five convenience shapes (see [`externals`](#externals) or [Usage Example: Basic usage](/plugins/vite-plugin-external/usage#basic-usage)); the plugin performs the normalisation step internally.

## `externals`
* Type: `ExternalFn | boolean | string | RegExp | Array<string | RegExp> | Record<string, string>`
* Required: `false`

Configure external dependencies. [Example](/plugins/vite-plugin-external/usage#basic-usage)

## `logLevel`
* Type: `"TRACE" | "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL" | "OFF"`
* Required: `false`
* Default: `"WARN"`

Sets the logging level.

## `enableBanner`
* Type: `boolean`
* Required: `false`
* Default: `false`

Whether to print the startup banner. The banner is only printed when explicitly set to `true`.

## `nodeBuiltins`
* Type: `boolean`
* Required: `false`

Whether to exclude Node.js built-in modules. Build phase only. Also overridable per mode (see [`[mode: string]`](#mode-string-index-signature)). [Example](/plugins/vite-plugin-external/usage#excluding-dependencies-during-build)

## `externalizeDeps`
* Type: `Array<string | RegExp>`
* Required: `false`

Specify dependencies to exclude from bundling. Build phase only. Also overridable per mode (see [`[mode: string]`](#mode-string-index-signature)). [Example](/plugins/vite-plugin-external/usage#excluding-dependencies-during-build)

## `interop`
* Type: `"auto" | undefined`
* Required: `false`

This option controls how Vite adjust build strategies. [Example](/plugins/vite-plugin-external/usage#adjusting-build-strategies)

## `apply`
* Type: `'serve' | 'build' | ((this: void, config: UserConfig, env: ConfigEnv) => boolean)`
* Required: `false`

Apply the plugin only for serve or build, or on certain conditions. Refer to [Vite Plugin apply](https://vitejs.dev/guide/api-plugin.html#apply).

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

Relative paths are resolved against `cwd` (not `process.cwd()`); absolute paths are used as-is.

## `[mode: string]` Index Signature
* Type: `ModeOptions` — `development` / `production` / `test` / `staging` are explicitly typed as `BasicOptions`; any custom mode key falls through to `unknown`
* Required: `false`

Override `BasicOptions` fields (`externals` / `logLevel` / `cwd` / `cacheDir` / `nodeBuiltins` / `externalizeDeps`) per mode. Plugin-level fields (`interop` / `apply` / `enableBanner`) are intentionally **not** overridable; a mode block containing non-`BasicOptions` keys triggers a runtime warning and the key is dropped. [Example](/plugins/vite-plugin-external/usage#multi-mode-configuration)

---

## TypeScript Definitions

```typescript
import type { ConfigEnv, UserConfig } from 'vite';
import type { LogLevel } from 'vp-runtime-helper';

export type NullValue = null | undefined | void;

export type ExternalFn = (
  source: string,
  importer: string | undefined,
  isResolved: boolean
) => string | boolean | NullValue;

export type { LogLevel } from 'vp-runtime-helper';

export interface BasicOptions {
  /**
   * External dependencies configuration (five accepted shapes)
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
   * Exclude Node.js built-in modules (build phase only)
   */
  nodeBuiltins?: boolean;

  /**
   * Dependencies to exclude from bundling (build phase only)
   */
  externalizeDeps?: Array<string | RegExp>;
}

export interface ModeOptions {
  /** Custom modes fall through here. */
  [mode: string]: unknown;

  development?: BasicOptions;
  production?: BasicOptions;
  test?: BasicOptions;
  staging?: BasicOptions;
}

export interface Options extends BasicOptions, ModeOptions {
  /**
   * Controls Vite's default build-strategy handling
   */
  interop?: 'auto';

  /**
   * Apply the plugin only for serve or build, or on certain conditions
   */
  apply?:
    | 'serve'
    | 'build'
    | ((this: void, config: UserConfig, env: ConfigEnv) => boolean);

  /**
   * Whether to print the startup banner
   * @default false
   */
  enableBanner?: boolean;
}

export interface ResolvedOptions extends Options, ConfigEnv {
  cwd: string;
  cacheDir: string;
}
```
