import type { ConfigEnv, UserConfig } from 'vite';
import type { LogLevel } from 'vp-runtime-helper';

import type { ExternalEsConfig, ExternalFn } from './deps';


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
