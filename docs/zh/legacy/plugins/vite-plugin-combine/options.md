
::: danger 这是 Vite 1.x – 6.x 旧版文档归档 / This is Vite 1.x – 6.x legacy archive
- 本文档对应插件版本：**vite-plugin-view ≤ 4.x、vite-plugin-external ≤ 7.x、vite-plugin-build-chunk ≤ 4.x 等旧发行版**。
- 适用打包器：Rollup / esbuild（Vite 6 及之前的默认组合）。**不支持 Vite 8+ 的 Rolldown 打包器**，Vite 7/8+ 用户请立即返回新文档。
- 本目录内容已冻结，不再维护。遇到新功能/新字段请查看最新文档：
  - 中文新文档：<a href="/zh/plugins/">/zh/plugins/</a>
  - English new docs：<a href="/plugins/">/plugins/</a>
:::
# 配置项（旧版）

## TypeScript 定义

```ts
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
   * 合并后的目标文件虚拟路径。
   *
   * @default 'index.js'
   */
  target: string;

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
  exports?: 'named' | 'default' | 'both' | 'all' | 'none';

  /**
   * The value of enforce can be either `"pre"` or `"post"`, see more at https://vitejs.dev/guide/api-plugin.html#plugin-ordering.
   *
   * 强制执行顺序，`pre` 前，`post` 后，参考 https://cn.vitejs.dev/guide/api-plugin.html#plugin-ordering。
   */
  enforce?: 'pre' | 'post';

  /**
   * Apply the plugin only for serve or build, or on certain conditions.
   *
   * 应用插件仅在 serve 或 build 时，或满足某些条件的情况下。
   */
  apply?: 'serve' | 'build' | ((this: void, config: UserConfig, env: ConfigEnv) => boolean);

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
   * Whether to output the banner
   *
   * 是否输出 banner
   */
  enableBanner?: boolean;

  /**
   * Whether to generate d.ts file
   *
   * 是否生成 d.ts 文件
   */
  dts?: boolean | DtsPluginOptions;
}
```