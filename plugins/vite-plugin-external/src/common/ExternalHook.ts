import { ensureType, isPlainObject } from 'is-what-type';

import type { ExternalFn, NullValue } from '../typings';

function ensureArray<T>(
  items: Array<T | false | NullValue> | T | false | NullValue,
): T[] {
  if (Array.isArray(items)) {
    return items.filter(Boolean) as T[];
  }
  if (items) {
    return [items];
  }
  return [];
}

/**
 * Compiles every user-visible 'externals' input shape into a list of
 * uniform 'ExternalFn' hooks evaluated in order per '(id, importer, isResolved)'.
 * The first truthy result wins.
 *
 * 设计背景（Design rationale）：
 * 用户调用时可能在配置里写 N 种形态，且还存在"多来源叠加"的场景：
 *   1. 'opts.externals' 用户声明
 *   2. 'opts.externalizeDeps' 追加的一堆库名（字符串 / 正则）
 *   3. 'opts.nodeBuiltins' 追加的 'fs'、'path'、'node:*' 正则数组
 *   4. 用户 vite.config 里本身写的 'build.rolldownOptions.external'
 *   5. 'opts[mode].externals' 按模式覆盖合并
 *
 * Many sources contribute externals at runtime: user options, the
 * 'externalizeDeps'/'nodeBuiltins' shortcuts, raw 'rolldownOptions.external'
 * from the vite config, and per-mode overrides. If each case were a
 * dedicated branch the main pipeline would bloat into something very hard
 * to audit. ExternalHook normalises every contribution to a single
 * 'ExternalFn' and chains them in 'this.hooks', so the call site only has
 * one loop: "iterate hooks, first truthy return wins".
 *
 * 如果每加一种形态就写一段 if，主流程会膨胀得不可读。
 * ExternalHook 把所有来源统一"编译"成一列函数：
 *   - 每次调用 'use()' 往 'this.hooks' 追加一个 'ExternalFn'
 *   - 调用方（handleExternals / Resolver.resolve）按顺序调用，第一个 true/string 胜出
 *
 * Why skip ids starting with '\0' in the function form?
 * '\0xxx' is the conventional Rolldown/Vite prefix for internal virtual
 * modules. Those must never be treated as external dependencies, or the
 * owning plugin will be unable to resolve its own internal protocol.
 *
 * 为什么函数形态里要加 '!id.startsWith('\0')'？
 * '\0xxx' 是 Rolldown/Vite 生态约定的"虚拟模块前缀"。这类 id 一定是其他
 * 插件内部使用的标记，不应该被当作外部依赖，否则会把其他插件的内部协议打断。
 */
export default class ExternalHook {
  readonly hooks: ExternalFn[] = [];

  use(
    arg:
      | ExternalFn
      | boolean
      | string
      | RegExp
      | Array<string | RegExp>
      | Record<string, string>,
  ): this {
    let hook: ExternalFn;
    const type = typeof arg;

    // Case 1 — boolean switch. 'externals: true' → externalise every import.
    // —— case 1: boolean 全量开关。'externals: true' → 所有 import 都 external。极少用。
    if (ensureType<boolean>(arg, type === 'boolean')) {
      hook = () => arg;
    }

    // Case 2 — user-supplied function. Forward as-is, except we filter out
    // the '\0' virtual-module prefix described above.
    // —— case 2: 用户自定义函数。原样转发，额外过滤 \0 虚拟模块（见上文）。
    else if (ensureType<ExternalFn>(arg, type === 'function')) {
      hook = (
        id: string,
        importer: string | undefined,
        isResolved: boolean,
      ) => (!id.startsWith('\0') && arg(id, importer, isResolved)) || false;
    }

    // Case 3 — plain object dictionary '{ react: 'React', vue: 'Vue' }'.
    // Hit = return the value as a string; upper layers decide if it's a
    // global name (IIFE) or an ESM CDN URL (ES format).
    // —— case 3: Record<string, string> {react:'React'}。命中就返回字符串 value，
    // 交给上层 Resolver 判断是 URL（ES）还是全局名（IIFE）。
    else if (isPlainObject<Record<string, string>>(arg)) {
      hook = (id: string) => arg[id];
    }

    // Case 4 — string | RegExp | Array of both. Pure "is external?" match
    // without a global name. Used by 'externalizeDeps' (list of lib names)
    // and 'nodeBuiltins' (regex list of Node builtins).
    // —— case 4: string | RegExp | (string | RegExp)[]。
    // 只匹配"是否 external"，不提供全局名。命中就返回 true。
    // 用途：'externalizeDeps' 的字符串列表、'nodeBuiltins' 的正则数组。
    else if (arg) {
      const ids = new Set<string>();
      const matchers: RegExp[] = [];
      for (const value of ensureArray(arg)) {
        if (value instanceof RegExp) {
          matchers.push(value);
        }
        else {
          ids.add(value);
        }
      }
      hook = (id: string) => ids.has(id) || matchers.some((matcher) => matcher.test(id));
    }

    // Case 5 — null / false / '' → never match.
    // —— case 5: null / false / '' 等 falsy 值 → 永远不 external。
    else {
      hook = () => false;
    }

    this.hooks.push(hook);
    return this;
  }
}
