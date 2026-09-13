import type { FastifyReply, FastifyRequest, FastifyServerOptions, RouteHandlerMethod } from 'fastify';
import type { Connect } from 'vite';
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

export interface RouteConfig {
  [route: string]: RouteValue;
}

/**
 * connect 中间件的 next 回调在 fastify 404 handler 之间的传递载体。
 *
 * fastify 以 `app.routing(req, res)` 嵌入 connect 中间件时，未匹配的请求会
 * 走到 fastify 的 404 handler，但那里拿不到 connect 的 `next`。因此
 * configureServer 在 middleware 里先把 `next` 挂到 `request.raw.__mockNext`，
 * 404 handler 取出并调用，让请求落回 Vite 的中间件链（配合 reply.hijack()）。
 */
export type ViteRequest = Connect.IncomingMessage & { __mockNext?: () => void };
export type MockRequest = FastifyRequest;
export type MockReply = FastifyReply;

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
   * Initial options of `fastify`. see more at https://fastify.dev/docs/latest/Reference/Server/
   */
  fastifyOptions?: FastifyServerOptions;

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
