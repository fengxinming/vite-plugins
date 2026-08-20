/**
 * 检查值是否为异步函数
 *
 * @example
 * ```js
 * isAsyncFunction(async () => { });      // true
 * isAsyncFunction(() => { });            // false
 * ```
 */
export default function isAsyncFunction<T = any>(value: T): boolean {
  return Object.prototype.toString.call(value) === '[object AsyncFunction]';
}
