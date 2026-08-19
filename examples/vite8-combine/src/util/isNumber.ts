/**
 * 检查是否是数字
 *
 * @example
 * ```js
 * isNumber(1);   // true
 * isNumber({});  // false
 * ```
 */
export default function isNumber<T = any>(value: T): boolean {
  // eslint-disable-next-line no-self-compare
  return typeof value === 'number' && value === value;
}
