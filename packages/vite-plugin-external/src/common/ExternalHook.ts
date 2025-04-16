import { isWhat } from 'is-what-type';
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
  ): this {
    let hook;
    const type = typeof arg;

    // boolean
    if (isWhat<boolean>(arg, type, 'boolean')) {
      hook = () => arg;
    }
    // ExternalFn
    else if (isWhat<ExternalFn>(arg, type, 'function')) {
      hook = (
        id: string,
        importer: string | undefined,
        isResolved: boolean) => (!id.startsWith('\0') && arg(id, importer, isResolved));
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
