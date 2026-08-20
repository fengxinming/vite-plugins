# 配置选项参考


> Type definitions copied verbatim from the plugin TypeScript source:
>
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

## `routes`
* **类型**：`RouteConfig | Array<RouteConfig | string> | string`
  * `RouteConfig | Array<RouteConfig | string>` - 需要添加到开发服务器的初始模拟路由列表。
  * `string` - 指定定义模拟路由的目录路径。
* **必填**：`false`

## `routerOptions`
* **类型**：`SirvConfig<HTTPVersion.V1> | SirvConfig<HTTPVersion.V2>`
* **必填**：`false`
  * `find-my-way` 库的初始配置选项，[详情见文档](https://github.com/delvedor/find-my-way#findmywayoptions)。

## `cwd`
* **类型**：`string`
* **必填**：`false`
* **默认值**：`process.cwd()`  
  当前工作目录。

## `isAfter`
* **类型**：`boolean`
* **必填**：`false`
  * 如果设为 `true`，这些模拟路由将在内部中间件安装完成后才进行匹配。

---

## TypeScript 类型定义

```typescript
import { Config as SirvConfig, HTTPVersion, RouteOptions, Handler } from 'find-my-way';

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
   * 需要提供文件的目录路径。
   * @default `process.cwd()`
   */
  cwd?: string;

  /**
   * 如果设为 `true`，这些模拟路由将在内部中间件安装完成后匹配。
   * @default `false`
   */
  isAfter?: boolean;

  /**
   * `find-my-way` 的初始配置选项。[详情见文档](https://github.com/delvedor/find-my-way#findmywayoptions)
   */
  routerOptions?: SirvConfig<HTTPVersion.V1> | SirvConfig<HTTPVersion.V2>;

  /**
   * 需要添加到开发服务器的初始模拟路由列表，
   * 或指定定义模拟路由的目录路径。
   */
  routes?: RouteConfig | Array<RouteConfig | string> | string;
}
```