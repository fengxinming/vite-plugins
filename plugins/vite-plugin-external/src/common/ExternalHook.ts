import { ensureType, isPlainObject } from 'is-what-type';
import { NullValue } from 'rollup';

import { ExternalFn } from '../typings';


function ensureArray<T>(
  items: Array<T | false | NullValue> | T | false | NullValue
): T[] {
  if (Array.isArray(items)) {
    return items.filter(Boolean) as T[];
  }
  if (items) {
    return [items];
  }
  return [];
}

export default class ExternalHook {
  readonly hooks: ExternalFn[] = [];

  use(
    arg:
    | ExternalFn
    | boolean
    | string
    | RegExp
    | Array<string | RegExp>
    | Record<string, string>
  ): this {
    let hook;
    const type = typeof arg;

    // boolean
    if (ensureType<boolean>(arg, type === 'boolean')) {
      hook = () => arg;
    }
    // ExternalFn
    else if (ensureType<ExternalFn>(arg, type === 'function')) {
      hook = (
        id: string,
        importer: string | undefined,
        isResolved: boolean) => (!id.startsWith('\0') && arg(id, importer, isResolved));
    }
    // object
    else if (isPlainObject<Record<string, string>>(arg)) {
      hook = (id: string) => arg[id];
    }
    // string | RegExp | (string | RegExp)[]
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
    else {
      hook = () => false;
    }
    this.hooks.push(hook);
    return this;
  }
}
