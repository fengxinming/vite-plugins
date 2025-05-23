# Option Reference

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
   * The directory to serve files from.
   * @default `process.cwd()`
   */
  cwd?: string;

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
}
```