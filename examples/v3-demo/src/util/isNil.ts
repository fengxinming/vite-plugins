
/**
 * 检查是否是 null 或 undefined
 *
 * @example
 * ```js
 * isNil(null);  // true
 * isNil(undefined);  // true
 * isNil({});  // false
 * ```
 *
 * @param value 要检查的值
 * @returns 是 null 或 undefined 返回 true，否则返回 false
 */
export default function isNil<T = any>(value: T): boolean {
  return value == null;
}
