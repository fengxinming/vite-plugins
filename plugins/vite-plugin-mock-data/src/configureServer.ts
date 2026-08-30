import fastifyFormbody from '@fastify/formbody';
import fastifyStatic from '@fastify/static';
import fastify, {
  type FastifyInstance,
  type FastifyServerOptions,
  type HTTPMethods,
  type RouteHandlerMethod
} from 'fastify';
import { isObject } from 'is-what-type';
import { ViteDevServer } from 'vite';

import type { MockData, MockRequest, RouteConfig, RouteValue } from './types';

/**
 * 解析路由 key：`"METHOD /path"`，支持 `METHOD1/METHOD2 /path` 与 `:param`。
 * 缺省 METHOD 时默认 GET。
 */
function parseRouteKey(xpath: string): { methods: HTTPMethods[], pathname: string } {
  const [first, second] = xpath.split(' ');
  const pathname = second ?? first;
  const methods = (second ? first : 'GET').toUpperCase().split('/') as HTTPMethods[];
  return { methods, pathname };
}

/**
 * 静态数据发送 handler：
 *   - 对象 / 数组（isObject 为真，数组也是 object）→ `reply.send(data)`，fastify 序列化为 JSON；
 *   - 其他（string / number / boolean / null）→ `String()` 转成字符串按文本发送
 *     （fastify 对 string 默认 Content-Type: text/plain）。
 */
function createStaticHandler(data: MockData): RouteHandlerMethod {
  return (_request, reply) => {
    reply.send(isObject(data) ? data : String(data));
  };
}

/**
 * 在 fastify 实例上注册单条 mock 路由。
 *
 * 路由值只分两种（与 types.ts 的 RouteValue 一一对应）：
 *   - 函数 → 原样透传，它就是 fastify 的 handler
 *     （fastify 原生处理两种响应方式：async 返回值自动发送 / 内部 reply.send()）；
 *   - 其他一切（对象 / 数组 / string / number / boolean / null）→ 静态数据，
 *     由 createStaticHandler 生成 handler 发送。
 */
function registerMockRoute(
  app: FastifyInstance,
  xpath: string,
  raw: RouteValue
) {
  const { methods, pathname } = parseRouteKey(xpath);

  app.route({
    method: methods,
    url: pathname,
    handler: typeof raw === 'function' ? raw : createStaticHandler(raw)
  });
}

/**
 * Mounts mock routes on the Vite dev server via a fastify instance.
 *
 * fastify is embedded as a connect middleware using its internal
 * `routing(req, res)` API, so the plugin keeps the exact middleware
 * semantics of the previous find-my-way based implementation:
 *   - matched mock routes are answered by fastify;
 *   - unmatched requests fall through to the next middleware via
 *     `setNotFoundHandler` + `reply.hijack()` + `next()`.
 *
 * Route config contract (unchanged from before):
 *   key = "METHOD /path", supports `METHOD1/METHOD2 /path` and `:param`.
 */
export async function configureServer(
  server: ViteDevServer,
  fastifyOptions: FastifyServerOptions | undefined,
  routes: RouteConfig[],
  cwd: string
) {
  const app = fastify({ logger: false, ...fastifyOptions });

  void app.register(fastifyFormbody);

  // Register @fastify/static so user handlers can call `reply.sendFile()`
  // to serve files from disk (the `file` route config field was removed —
  // this capability now lives entirely in user function handlers).
  void app.register(fastifyStatic, {
    root: cwd,
    setHeaders(reply, pathname) {
      reply.header('Access-Control-Allow-Origin', '*');
      if (/\.[tj]sx?$/.test(pathname)) {
        reply.header('Content-Type', 'application/javascript');
      }
      const headers = server.config.server.headers;
      if (headers) {
        for (const [key, val] of Object.entries(headers)) {
          if (val) {
            reply.header(key, val);
          }
        }
      }
    }
  });

  // Let unmatched requests fall through to Vite's middleware chain.
  app.setNotFoundHandler((request, reply) => {
    reply.hijack();
    const raw = request.raw as MockRequest;
    const next = raw.__mockNext;
    delete raw.__mockNext;
    next?.();
  });

  routes.forEach((route) => {
    for (const [key, val] of Object.entries(route)) {
      registerMockRoute(app, key, val);
    }
  });

  await app.ready();

  server.middlewares.use((req, res, next) => {
    (req as MockRequest).__mockNext = next;
    app.routing(req, res);
  });
}
