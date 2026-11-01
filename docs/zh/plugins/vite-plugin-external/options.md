# 配置选项参考


> 以下类型定义逐字拷贝自插件源码（`src/types.ts`，另含 `src/internal-types.ts` 的 `ResolvedOptions`）：
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

## ExternalFn 类型
* 声明形态：`(source: string, importer: string | undefined, isResolved: boolean) => string | boolean | NullValue`

**归一化决策签名（Decision hook）**：用户写的 `externals`（对象、函数、字符串、正则、数组、`true`）在内部都会先被统一转成这个签名的函数，然后在「开发预打包 / dev 中间件 / build」三个入口处共享完全相同的决策逻辑。返回值语义：
- `string`（绝对 URL）→ 走 ES CDN 重导出；
- `string`（其它）→ 走 IIFE 全局变量名；
- `true` → 纯 external（只不打包，不提供替换规则）；
- falsy → 不是 external，继续正常解析。

实际使用时直接写 `externals` 字段即可（对象/函数/正则等五种形态，见 [externals](#externals) 或 [使用示例：基础使用](/zh/plugins/vite-plugin-external/usage#基础使用)），本插件会自动做归一化。

## `externals`
* 类型：`ExternalFn | boolean | string | RegExp | Array<string | RegExp> | Record<string, string>`
* 必填：`false`

配置外部依赖项。[示例](/zh/plugins/vite-plugin-external/usage#基础使用)

## `logLevel`
* 类型：`"TRACE" | "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL" | "OFF"`
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

指定需要排除的打包依赖项。仅 build 阶段生效。支持按模式覆盖（见 [`[mode: string]`](#mode-string-索引签名)）。[示例](/zh/plugins/vite-plugin-external/usage#构建时仅排除依赖)

## `interop`
* 类型：`"auto" | undefined`
* 必填：`false`

控制 Vite 的默认构建策略调整。[示例](/zh/plugins/vite-plugin-external/usage#调整打包策略)

## `apply`
* 类型：`'serve' | 'build' | ((this: void, config: UserConfig, env: ConfigEnv) => boolean)`
* 必填：`false`

仅在 serve 或 build 阶段启用插件，或在满足条件时启用。参考 [Vite 插件 apply](https://cn.vitejs.dev/guide/api-plugin.html#apply)。

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

按模式覆盖 `BasicOptions` 字段（`externals` / `logLevel` / `cwd` / `cacheDir` / `nodeBuiltins` / `externalizeDeps`）。插件级字段（`interop` / `apply` / `enableBanner`）刻意不可按模式覆盖；模式块里出现非 `BasicOptions` 字段时运行时会打 warn 并丢弃该字段。[示例](/zh/plugins/vite-plugin-external/usage#多模式场景配置)

---

## TypeScript 类型定义

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
   * 外部依赖项配置（五种输入形态）
   */
  externals?:
    | ExternalFn
    | boolean
    | string
    | RegExp
    | Array<string | RegExp>
    | Record<string, string>;

  /**
   * 日志级别配置
   */
  logLevel?: LogLevel;

  /**
   * 解析 `cacheDir` 路径时的当前工作目录。
   * @default `process.cwd()`
   */
  cwd?: string;

  /**
   * 缓存目录路径
   * @default `${cwd}/node_modules/.vite_external`
   */
  cacheDir?: string;

  /**
   * 是否排除 Node.js 内置模块（仅 build 阶段）
   */
  nodeBuiltins?: boolean;

  /**
   * 需要排除的打包依赖项（仅 build 阶段）
   */
  externalizeDeps?: Array<string | RegExp>;
}

export interface ModeOptions {
  /** 自定义模式兜底 */
  [mode: string]: unknown;

  development?: BasicOptions;
  production?: BasicOptions;
  test?: BasicOptions;
  staging?: BasicOptions;
}

export interface Options extends BasicOptions, ModeOptions {
  /**
   * 控制 Vite 的默认构建策略调整
   */
  interop?: 'auto';

  /**
   * 仅在 serve 或 build 阶段启用插件，或在满足条件时启用
   */
  apply?:
    | 'serve'
    | 'build'
    | ((this: void, config: UserConfig, env: ConfigEnv) => boolean);

  /**
   * 是否输出启动 banner
   * @default false
   */
  enableBanner?: boolean;
}

export interface ResolvedOptions extends Options, ConfigEnv {
  cwd: string;
  cacheDir: string;
}
```
