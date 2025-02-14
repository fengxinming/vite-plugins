
/**
 * 检查是否是 Error 对象
 *
 * @example
 * ```js
 * isError(new Error());  // true
 * isError({});  // false
 * ```
 *
 * @param value 待检查的值
 * @returns `true` 表示为 Error 对象，否则为 `false`
 */
export default function isError(value: any): value is Error {
  return Object.prototype.toString.call(value).indexOf('Error') > -1;
}
