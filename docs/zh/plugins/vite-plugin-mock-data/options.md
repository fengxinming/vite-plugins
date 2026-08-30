# 配置选项参考

## `routes`

- **类型**：`RouteConfig | Array<RouteConfig | string> | string`
- **必填**：`false`

要添加到开发服务器的 mock 路由，支持三种形态：

- 目录路径 —— 目录下每个 `.ts` / `.js` / `.mjs` 文件都会被加载，其默认导出合并进路由；
- 数组 —— 可混合目录路径与内联 `RouteConfig` 对象；
- 内联 `RouteConfig` 对象。

```ts
routes: './mock'
routes: ['./mock', './mock2']
routes: { '/api/x': { ok: true } }
```

## `fastifyOptions`

- **类型**：`FastifyServerOptions`
- **必填**：`false`

传给底层 fastify 实例的初始配置（日志、body 大小限制等）。详见 [fastify Server 参考文档](https://fastify.dev/docs/latest/Reference/Server/)。

```ts
mockData({
  fastifyOptions: { logger: true }
})
```

## `cwd`

- **类型**：`string`
- **必填**：`false`
- **默认值**：`process.cwd()`

工作目录。用于解析路由文件中的相对路径，并作为 `@fastify/static`（即 `reply.sendFile()` 能力）的根目录。

## `cacheDir`

- **类型**：`string`
- **必填**：`false`
- **默认值**：`${cwd}/node_modules/.vite_mock_data`

插件写入编译后路由文件的目录（路由文件在加载时会被转译）。

## `logLevel`

- **类型**：`LogLevel`
- **必填**：`false`

插件的日志输出等级。

## `isAfter`

- **类型**：`boolean`
- **必填**：`false`
- **默认值**：`false`

若设为 `true`，mock 路由将在 Vite 内部中间件安装完成**之后**才进行匹配，反之则在之前。

## `enableBanner`

- **类型**：`boolean`
- **必填**：`false`

启动时是否输出插件 banner。

## TypeScript 类型定义

```ts
import type { FastifyServerOptions, RouteHandlerMethod } from 'fastify';
import type { LogLevel } from 'vp-runtime-helper';

/** fastify 风格的函数 handler `(request, reply)`，原样透传。 */
export type MockHandler = RouteHandlerMethod;

/** 任意可 JSON 序列化的静态数据，可直接写在路由顶层。 */
export type MockData =
  | string
  | number
  | boolean
  | null
  | MockData[]
  | { [key: string]: MockData };

/** 路由值：函数 handler 或静态数据。 */
export type RouteValue = MockHandler | MockData;

export interface RouteConfig {
  [route: string]: RouteValue;
}

export interface Options {
  /** 需要提供文件的目录路径。@default `process.cwd()` */
  cwd?: string;
  /** 编译后文件的缓存目录。@default `${cwd}/node_modules/.vite_mock_data` */
  cacheDir?: string;
  /** 日志输出等级。 */
  logLevel?: LogLevel;
  /** 若为 `true`，mock 路由在内部中间件安装完成后才匹配。@default `false` */
  isAfter?: boolean;
  /** `fastify` 的初始配置选项。 */
  fastifyOptions?: FastifyServerOptions;
  /** 需要添加的 mock 路由列表，或目录 / 目录列表。 */
  routes?: RouteConfig | Array<RouteConfig | string> | string;
  /** 是否输出 banner。 */
  enableBanner?: boolean;
}
```
