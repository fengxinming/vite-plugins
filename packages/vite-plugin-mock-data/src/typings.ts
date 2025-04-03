import { LogLevel } from 'base-log-factory';
import { Config as SirvConfig, Handler, HTTPVersion, RouteOptions } from 'find-my-way';

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
}
