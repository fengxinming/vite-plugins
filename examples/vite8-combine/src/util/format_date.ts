/**
 * 下划线命名示例 — 专门用来验证 nameExport 的驼峰化规则
 *
 * 目录里其它源文件名本身就是驼峰（isDate、noop…），无论 nameExport 是否生效，
 * 导出名都一样，测不出转换逻辑；这个文件必须走 'format_date' → 'formatDate'。
 * Underscore-named on purpose: the other sources are already camelCase, so only this
 * file can prove that nameExport actually transforms names.
 */
export default function formatDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}
