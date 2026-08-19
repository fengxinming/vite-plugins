/**
 * 检查是否是 Error 对象
 *
 * @example
 * ```js
 * isError(new Error());  // true
 * isError({});           // false
 * ```
 */
export default function isError(value: any): value is Error {
  return Object.prototype.toString.call(value).indexOf('Error') > -1;
}
