
/**
 * 检查是否是日期对象
 *
 * @example
 * ```js
 * isDate(new Date());      //true
 * isDate({});      //false
 * ```
 *
 * @param value 要检查的值
 * @returns 如果是日期对象则返回 `true`，否则返回 `false`
 */
export default function isDate(value: any): value is Date {
  return value instanceof Date;
}
