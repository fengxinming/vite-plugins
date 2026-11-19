import type { Rolldown } from 'vite';

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
export type RolldownOutputOptions = Exclude<RolldownOptions['output'], string | undefined | any[]>;
export type ModuleFormat = Rolldown.ModuleFormat;

