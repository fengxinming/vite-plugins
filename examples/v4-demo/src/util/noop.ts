
/**
 * 空函数
 *
 * @example
 * ```js
 * noop();
 * noop(1, 2, 3);
 * noop.call(null);
 * ```
 *
 * @param args 任意参数
 */
function noop(...args: any[]): any;
function noop(): any {}
export default noop;
