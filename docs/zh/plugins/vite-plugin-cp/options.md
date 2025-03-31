# 配置项

```ts
export interface Target {
  /**
   * Path or glob of what to copy.
   *
   * 要复制的目录、文件或者 `globby` 匹配规则。
   */
  src: string | string[];

  /**
   * One or more destinations where to copy.
   *
   * 复制到目标目录。
   */
  dest: string;

  /**
   * Rename the file after copying.
   *
   * 复制后重命名文件。
   */
  rename?: string | ((name: string) => string);

  /**
   * Remove the directory structure of copied files, if `src` is a directory.
   *
   * 是否删除复制的文件目录结构，`src` 为目录时有效。
   */
  flatten?: boolean;

  /**
   * Options for tinyglobby. See more at https://github.com/sindresorhus/globby#options
   *
   * tinyglobby 的选项，设置 `src` 的匹配参数
   */
  globOptions?: GlobOptions;

  /**
   * Options for fs-extra.copy See more at https://github.com/jprichardson/node-fs-extra/blob/HEAD/docs/copy.md
   *
   * fs-extra.copy 的选项，设置 `src` 的复制参数
   */
  copyOptions?: CopyOptions;

  /**
   * Transform the file before copying.
   *
   * 复制前转换文件内容。
   */
  transform?: TransformFile;
}

export interface Options {
  /**
   * Default `'closeBundle'`, vite hook the plugin should use.
   *
   * 默认 `'closeBundle'`，调用指定钩子函数时开始复制。
   *
   * @default 'closeBundle'
   */
  hook?: string;

  /**
   * The value of enforce can be either `"pre"` or `"post"`, see more at https://vitejs.dev/guide/api-plugin.html#plugin-ordering.
   *
   * 强制执行顺序，`pre` 前，`post` 后，参考 https://cn.vitejs.dev/guide/api-plugin.html#plugin-ordering
   */
  enforce?: 'pre' | 'post';

  /**
   * Options for tinyglobby. See more at https://github.com/SuperchupuDev/tinyglobby?tab=readme-ov-file#options
   *
   * tinyglobby 的选项，设置 `src` 的匹配参数。
   */
  globOptions?: GlobOptions;

  /**
   * Options for fs-extra.copy See more at https://github.com/jprichardson/node-fs-extra/blob/HEAD/docs/copy.md
   *
   * fs-extra.copy 的选项，设置 `src` 的复制参数
   */
  copyOptions?: CopyOptions;

  /**
   * Default `process.cwd()`, The current working directory in which to search.
   *
   * 默认 `process.cwd()`，用于拼接 `src` 的路径。
   *
   * @default `process.cwd()`
   */
  cwd?: string;

  /**
   * Array of targets to copy.
   *
   * 复制文件的规则配置。
   */
  targets: Target[];

  /**
   * Default `'warn'`, The log level to use.
   *
   * 默认 `'warn'`，日志等级。
   *
   * @default 'WARN'
   */
  logLevel?: LogLevel;

  /**
   * Delay in milliseconds before copying.
   *
   * 复制前的延迟时间。
   */
  delay?: number;
}
```