/**
 * Checks if `value` is `null` or `undefined`.
 *
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is nullish, else `false`.
 * @example
 * ```ts
 * isNil(null)
 * // => true
 *
 * isNil(void 0)
 * // => true
 *
 * isNil(NaN)
 * //=> false
 * ```
 * @param value The value to check.
 * @returns `true` if `value` is nullish, else `false`.
 */
export default function isNil(value: unknown): value is null | undefined {
  return value == null;
}
