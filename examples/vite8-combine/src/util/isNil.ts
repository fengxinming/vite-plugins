/**
 * 检查是否是 null 或 undefined
 *
 * @example
 * ```js
 * isNil(null);       // true
 * isNil(undefined);  // true
 * isNil({});         // false
 * ```
 */
export default function isNil<T = any>(value: T): boolean {
  return value == null;
}
