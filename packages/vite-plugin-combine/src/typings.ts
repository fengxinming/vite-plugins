export type NameExport = (name: string, filePath: string) => string;

export interface Options {
  /**
   * Files prepared for combine.
   *
   * 准备合并的文件
   */
  src: string | string[];
  /**
   * Combines into the target file.
   *
   * 组合到目标文件
   *
   * @default 'index.js'
   */
  target: string;

  /**
   * Name exports.
   *
   * 给导出的内容命名
   */
  nameExport?: NameExport | boolean;

  /**
   * Exported module types.
   *
   * 导出的模块类型
   *
   * @default 'named'
   */
  exports?: 'named' | 'default' | 'none';

  /**
   * The value of enforce can be either `"pre"` or `"post"`, see more at https://vitejs.dev/guide/api-plugin.html#plugin-ordering.
   *
   * 强制执行顺序，`pre` 前，`post` 后，参考 https://cn.vitejs.dev/guide/api-plugin.html#plugin-ordering。
   */
  enforce?: 'pre' | 'post';

  /**
   * Current Working Directory.
   *
   * 当前工作目录
   */
  cwd?: string;
}
