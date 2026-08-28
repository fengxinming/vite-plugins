import { ensureType, isPlainObject } from 'is-what-type';

import type { ExternalFn, NullValue } from '../types';

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
 * 将用户传入的各种 externals 输入形态（函数、布尔值、字符串、正则、数组、对象）
 * 统一编译为一组 ExternalFn 判断函数，按插入顺序轮询，第一个 truthy 结果胜出。
 *
 * 设计背景：
 * 运行时 externals 的来源非常多：用户配置、externalizeDeps/nodeBuiltins 快捷开关、
 * vite.config 里本身的 rolldownOptions.external、以及按模式的 override 合并。
 * 如果每种来源都写一段独立分支，主流程会膨胀得难以审计。
 * ExternalHook 把所有来源统一"编译"为同签名函数列表，调用方只需一个循环：
 * 遍历 hooks，第一个 truthy 结果胜出。
 *
 * 为什么函数形态要过滤 \0 前缀？
 * '\0xxx' 是 Rolldown/Vite 生态约定的"虚拟模块前缀"，这类 id 一定是其他
 * 插件内部使用的协议标记，绝对不能被当作外部依赖处理，否则会打断其他插件
 * 自己的内部通信。
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

    // case 1: boolean 全量开关，'externals: true' → 所有 import 都 external。极少使用。
    if (ensureType<boolean>(arg, type === 'boolean')) {
      hook = () => arg;
    }

    // case 2: 用户自定义函数，原样转发，额外过滤 \0 虚拟模块前缀。
    else if (ensureType<ExternalFn>(arg, type === 'function')) {
      hook = (
        id: string,
        importer: string | undefined,
        isResolved: boolean,
      ) => (!id.startsWith('\0') && arg(id, importer, isResolved)) || false;
    }

    // case 3: Record<string, string> {react:'React'}。命中就返回字符串 value，
    // 交给上层 Resolver 判断是绝对 URL（ES CDN）还是全局名（IIFE）。
    else if (isPlainObject<Record<string, string>>(arg)) {
      hook = (id: string) => arg[id];
    }

    // case 4: string | RegExp | (string | RegExp)[]。
    // 只匹配"是否 external"，不提供全局名。命中即返回 true。
    // 用途：externalizeDeps 的字符串列表、nodeBuiltins 的正则数组。
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

    // case 5: null / false / '' 等 falsy 值 → 永远不命中。
    else {
      hook = () => false;
    }

    this.hooks.push(hook);
    return this;
  }
}
