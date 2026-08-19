/**
 * 空函数
 *
 * @example
 * ```js
 * noop();
 * noop(1, 2, 3);
 * ```
 */
function noop(...args: any[]): any;
function noop(): any {}
export default noop;
