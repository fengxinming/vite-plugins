/**
 * 检查是否是数字
 *
 * @example
 * ```js
 * isNumber(1);  // true
 * isNumber({});  // false
 * ```
 *
 * @param value 要检查的值
 * @returns 如果是数字返回 `true`，否则返回 `false`
 */
export default function isNumber(value) {
  // eslint-disable-next-line no-self-compare
  return typeof value === 'number' && value === value;
}
