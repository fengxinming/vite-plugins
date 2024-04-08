

/**
 * 检查是否是一个对象
 *
 * @example
 * ```js
 * isObject(1);  // false
 * isObject(undefined);  // false
 * isObject({});  // true
 * ```
 *
 * @param value 要检查的值
 * @returns 如果是对象返回`true`，否则返回`false`
 */
export default function isObject(value) {
  return value !== null && typeof value === 'object';
}
