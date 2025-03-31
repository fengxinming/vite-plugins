import type { LogLevel } from 'base-log-factory';
import type { NullValue } from 'rollup';

export type { LogLevel };

export type NameExport = (name: string, filePath: string) => string;

export interface Options {
  /**
   * Path to the files to be combined, supports glob patterns.
   *
   * 需要合并的文件路径，支持 glob 模式。
   */
  src: string | string[];
  /**
   * Path to the target file after combination.
   *
   * 合并后的目标文件路径。
   *
   * @default 'index.js'
   */
  target: string;

  /**
   * Whether to overwrite the existing target file。
   *
   * 是否覆盖已存在的目标文件。
   *
   * @default false
   */
  overwrite?: boolean;

  /**
   * Custom function or boolean value for controlling the generation of export names.
   *
   * 自定义导出名称的函数或布尔值，用于控制导出名称的生成方式。
   */
  nameExport?: NameExport | boolean;

  /**
   * Exported module types.
   *
   * 导出的模块类型
   *
   * @default 'named'
   */
  exports?: 'named' | 'default' | 'both' | 'none';

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

  /**
   * Log level
   *
   * 输出日志等级
   */
  logLevel?: LogLevel;

  /**
   * Handle code before writing to the file.
   *
   * 写入文件前处理代码字符串
   */
  beforeWrite?: (code: string) => string | NullValue;

  /**
   * Delay to clear the target file.
   *
   * 延迟清除目标文件。
   */
  delayToClear?: number;
}
