
::: danger This is Vite 1.x – 6.x LEGACY documentation archive / 这是 Vite 1.x – 6.x 旧版文档归档
- These pages correspond to old plugin releases: **vite-plugin-view ≤ 4.x, vite-plugin-external ≤ 7.x, vite-plugin-build-chunk ≤ 4.x, etc.**
- Bundler covered: Rollup + esbuild (the default Vite 6 and below stack). **This does NOT apply to Vite 8+ with the new Rolldown bundler**; Vite 7/8+ users, go to the current docs immediately.
- Content under this folder is frozen and unmaintained. For any new option / field, check the current docs:
  - Latest English docs: [/guide/introduction](/guide/introduction)
  - 最新中文文档：[/zh/guide/introduction](/zh/guide/introduction)
:::
# Option Reference (legacy)

## `routes`
* Type: `RouteConfig | Array<RouteConfig | string> | string`
  * `RouteConfig | Array<RouteConfig | string>` - Initial list of mock routes that should be added to the dev server.
  * `string` - Specify the directory to define mock routes that should be added to the dev server.
* Required: `false`

## `routerOptions`
* Type: `SirvConfig<HTTPVersion.V1> | SirvConfig<HTTPVersion.V2>`
* Required: `false`
[Initial options of `find-my-way`](https://github.com/delvedor/find-my-way#findmywayoptions)

## `cwd`
* Type: `string`
* Required: `false`
* Default: `process.cwd()`.
Current working directory.

## `isAfter`
* Type: `boolean`
* Required: `false`
If `true`, these mock routes is matched after internal middlewares are installed.

## TypeScript Definitions

```ts
export interface HandleRoute {
  file?: string;
  handler?: any | Handler<HTTPVersion.V1>;
  options?: RouteOptions;
  store?: any;
}

export interface RouteConfig {
  [route: string]: string | Handler<HTTPVersion.V1> | HandleRoute;
}

export interface Options {
  /**
   * The directory to serve files from.
   * @default `process.cwd()`
   */
  cwd?: string;

  /**
   * Cache directory for compiled files.
   *
   * 用于存放 ts 被编译后存放的文件目录。
   *
   * @default `${cwd}/node_modules/.vite_mock_data`
   */
  cacheDir?: string;

  /**
   * Log level
   *
   * 输出日志等级
   */
  logLevel?: LogLevel;

  /**
   * If `true`, these mock routes is matched after internal middlewares are installed.
   * @default `false`
   */
  isAfter?: boolean;

  /**
   * Initial options of `find-my-way`. see more at https://github.com/delvedor/find-my-way#findmywayoptions
   */
  routerOptions?: SirvConfig<HTTPVersion.V1> | SirvConfig<HTTPVersion.V2>;

  /**
   * Initial list of mock routes that should be added to the dev server
   * or specify the directory to define mock routes that should be added to the dev server.
   */
  routes?: RouteConfig | Array<RouteConfig | string> | string;

  /**
   * Whether to output the banner
   *
   * 是否输出 banner
   */
  enableBanner?: boolean;
}
```
