/**
 * 检查是否是日期对象
 *
 * @example
 * ```js
 * isDate(new Date());  // true
 * isDate({});          // false
 * ```
 */
export default function isDate(value: any): value is Date {
  return value instanceof Date;
}
