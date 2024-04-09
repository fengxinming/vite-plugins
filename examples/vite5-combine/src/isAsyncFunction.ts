
/**
 * 检查值是否为异步函数
 *
 * @example
 * ```js
 * isAsyncFunction(async () => { });      //true
 * isAsyncFunction(() => { });      //false
 * ```
 *
 * @param value 待校验的值
 * @returns `true` 表示为异步函数，否则为 `false`
 */
export default function isAsyncFunction<T = any>(value: T): value is T {
  return Object.prototype.toString.call(value) === '[object AsyncFunction]';
}
