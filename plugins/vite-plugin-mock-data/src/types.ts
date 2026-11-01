import type { FastifyReply, FastifyRequest, FastifyServerOptions, RouteHandlerMethod } from 'fastify';
import type { LogLevel } from 'vp-runtime-helper';

/**
 * 函数形式的 handler：fastify 原生风格 `(request, reply)`。
 * 原样透传给 fastify，两种响应方式都由 fastify 处理：
 *   - async handler 的返回值自动发送（对象序列化为 JSON）；
 *   - handler 内部自行调用 `reply.send()`。
 * Function handler in fastify style. Passed through to fastify as-is.
 */
export type MockHandler = RouteHandlerMethod;

/**
 * 任意 JSON 可序列化的静态数据。
 *
 * 可直接写在路由 key 后面（顶层），对象 / 数组 / 原始值一律按数据发送：
 *   - string → String() 后按文本发送（fastify 默认 text/plain）；
 *   - 其他值（object / array / number / boolean / null）→ 对象按 JSON 发送，
 *     非对象经 String() 转成字符串按文本发送（见 configureServer.ts 的 createStaticHandler）。
 *
 * 不再需要排除任何字段——运行时分流只判断「是不是函数」：
 * 函数 → handler 透传；非函数 → 本类型（静态数据）。
 *
 * Any JSON-serializable static data, usable directly at the route top level.
 * Runtime dispatch only checks `typeof value === 'function'` — functions are
 * passed through as handlers, everything else is static data.
 */
export type MockData =
  | string
  | number
  | boolean
  | null
  | MockData[]
  | { [key: string]: MockData };

/**
 * 路由配置值：函数 handler 或静态数据两种形态。
 * 函数原样透传给 fastify；非函数按静态数据发送。
 *
 * Route config value: a function handler (passed through to fastify) or
 * static data (sent by a plugin-generated handler).
 */
export type RouteValue = MockHandler | MockData;
export type DevRequest = FastifyRequest;
export type DevReply = FastifyReply;


export interface RouteConfig {
  [route: string]: RouteValue;
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
   * @default `${cwd}/node_modules/.vite-plugin-mock-data`
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
   * Initial options of `fastify`. see more at https://fastify.dev/docs/latest/Reference/Server/#routeroptions
   */
  fastifyOptions?: FastifyServerOptions;

  /**
   * Initial list of mock routes that should be added to the dev server
   * or specify the directory to define mock routes that should be added to the dev server.
   */
  routes?: RouteConfig | Array<RouteConfig | string> | string;

  /**
   * 是否把 mock 路由提供给浏览器端运行时（`vite-plugin-mock-data/mock-client` 与
   * `vite-plugin-mock-data/axios-adapter`），使打包后的静态页面（双击打开或静态托管）
   * 也能通过客户端 axios adapter 使用 mock 数据。
   *
   * - `true`：构建期通过 `resolveId`/`load` 提供虚拟模块
   *   `virtual:mock-routes`，把文件型 routes（`routes` 为字符串目录 / 文件）的清单
   *   与按 fastify `routerOptions` 推导的编译选项注入运行时，随 app 构建静态导入
   *   链打进产物；浏览器端由 `createMockAdapter`（来自
   *   `vite-plugin-mock-data/axios-adapter`）拦截 axios 请求。
   * - 仅支持文件型 routes；内联 `RouteConfig` 对象为 dev-only，不会被打包。
   * - 函数型 handler 会在浏览器端用模拟的 `req`/`reply` 执行（见 mock-client 文档）。
   *
   * @default false
   */
  buildMock?: boolean;

  /**
   * Whether to output the banner
   *
   * 是否输出 banner
   */
  enableBanner?: boolean;
}

export interface MockRequest {
  url: string;
  method?: string;
  query?: Record<string, string>;
  body?: any;
  headers?: Record<string, string>;
}

export interface MockResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
}
