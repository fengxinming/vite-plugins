
::: danger This is Vite 1.x – 6.x LEGACY documentation archive / 这是 Vite 1.x – 6.x 旧版文档归档
- These pages correspond to old plugin releases: **vite-plugin-view ≤ 4.x, vite-plugin-external ≤ 7.x, vite-plugin-build-chunk ≤ 4.x, etc.**
- Bundler covered: Rollup + esbuild (the default Vite 6 and below stack). **This does NOT apply to Vite 8+ with the new Rolldown bundler**; Vite 7/8+ users, go to the current docs immediately.
- Content under this folder is frozen and unmaintained. For any new option / field, check the current docs:
  - Latest English docs: [/guide/introduction](/guide/introduction)
  - 最新中文文档：[/zh/guide/introduction](/zh/guide/introduction)
:::
# Options (legacy)


> Type definitions copied verbatim from the plugin TypeScript source:
>
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

## TypeScript Definitions

```typescript
import type { NullValue } from 'rollup';
import type { ConfigEnv, UserConfig } from 'vite';
import type { PluginOptions as DtsPluginOptions } from 'vite-plugin-dts';
import type { LogLevel } from 'vp-runtime-helper';

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
