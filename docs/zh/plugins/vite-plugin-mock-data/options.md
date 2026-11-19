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
- **默认值**：`${cwd}/node_modules/.vite-plugin-mock-data`

插件写入编译后路由文件的目录（路由文件在加载时会被转译）。

相对路径以 `cwd` 为基准解析（不是 `process.cwd()`），传绝对路径则原样使用。

## `logLevel`

- **类型**：`LogLevel`
- **必填**：`false`

插件的日志输出等级。

## `isAfter`

- **类型**：`boolean`
- **必填**：`false`
- **默认值**：`false`

若设为 `true`，mock 路由将在 Vite 内部中间件安装完成**之后**才进行匹配，反之则在之前。

## `base`

- **类型**：`string`
- **必填**：`false`
- **默认值**：跟随 Vite 的 `base`（Vite 默认 `/`，归一化后即无前缀）

mock 路由的路径前缀，用来拼接**已定义的路由**：`base: '/app'` + `GET /api/users` → `/app/api/users`。

同一个值用在两处：

- **dev 端（服务端）**：作为 fastify `register(..., { prefix })` 的前缀注册全部路由；
- **浏览器端**：开启 `mockIn` 时，该值通过虚拟模块 `virtual:mock-routes` 的 `base` 导出下发，由 `normalizeRoutes` 编进路径正则。

取值与归一化规则：

- 未配置（`undefined` / `null`）时，取 Vite 解析后的 `base`；
- 开头的 `./` 换成 `/`，末尾连续的 `/` 去掉。因此 `'./'` 与 `'/'` 都归一化成空串（无前缀），`'/app/'` 归一化成 `'/app'`；
- 客户端要访问带前缀的路径有两种写法，都能命中：配 axios `baseURL: '/app'` 再请求 `/api/users`（`axios.getUri` 拼成 `/app/api/users`），或直接写全 `/app/api/users`；
- 它是**路由**前缀，与 axios 的 `baseURL` 不是同一个概念：后者只影响请求 url 的拼接，且已由 `axios.getUri(config)` 在 adapter 内完成，无需在 `base` 中重复配置。

```ts
mockData({
  routes: './mock',
  mockIn: 'client',
  base: '/app'
})
```

## `mockIn`

- **类型**：`boolean | 'build' | 'client'`
- **必填**：`false`
- **默认值**：`false`

浏览器端 mock（`vite-plugin-mock-data/mock-client` 与 `vite-plugin-mock-data/axios-adapter`）的注入时机：

| 取值 | `vite build` | dev / serve |
|------|--------------|-------------|
| `false`（默认） | 不注入 | 不注入 |
| `'build'` | 注入 | 不注入 |
| `'client'` | 注入 | 注入 |

`'client'` 是超集：浏览器端要 mock 就选它；只让静态产物带 mock 选 `'build'`。`true` 视作 `'build'`，`false` 视作不注入。

- 只影响浏览器端这条链；dev 端的服务端 mock 由 fastify 中间件提供，不受影响；
- 只支持文件型 `routes`（目录 / 目录数组）；内联 `RouteConfig` 对象是 dev-only，不会被打包；
- 浏览器端要真的用到 mock，入口必须静态 import `vite-plugin-mock-data/axios-adapter`（内部引入 `mock-client` → `virtual:mock-routes`），否则产物里不会有路由表。

```ts
mockData({
  routes: './mock',
  mockIn: 'client'
})
```

## `buildMock`（已废弃）

- **类型**：`boolean`
- **必填**：`false`
- **默认值**：`false`

**@deprecated** 用 `mockIn: 'build'` 代替。保留为兼容别名：仅在未配置 `mockIn` 时生效，`true` 等价于 `mockIn: 'build'`，下个大版本移除。

## `enableBanner`

- **类型**：`boolean`
- **必填**：`false`

启动时是否输出插件 banner。

## TypeScript 类型定义

```ts
import type { FastifyReply, FastifyRequest, FastifyServerOptions, RouteHandlerMethod } from 'fastify';
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

/** 传给 dev 端函数 handler 的 fastify request 对象。 */
export type DevRequest = FastifyRequest;

/** 传给 dev 端函数 handler 的 fastify reply 对象。 */
export type DevReply = FastifyReply;

export interface RouteConfig {
  [route: string]: RouteValue;
}

export interface Options {
  /** 需要提供文件的目录路径。@default `process.cwd()` */
  cwd?: string;
  /** 编译后文件的缓存目录。@default `${cwd}/node_modules/.vite-plugin-mock-data` */
  cacheDir?: string;
  /** 日志输出等级。 */
  logLevel?: LogLevel;
  /** 若为 `true`，mock 路由在内部中间件安装完成后才匹配。@default `false` */
  isAfter?: boolean;
  /** `fastify` 的初始配置选项。 */
  fastifyOptions?: FastifyServerOptions;
  /** 需要添加的 mock 路由列表，或目录 / 目录列表。 */
  routes?: RouteConfig | Array<RouteConfig | string> | string;
  /** mock 路由的路径前缀；未配置时跟随 Vite 的 base。 */
  base?: string;
  /** @deprecated 用 `mockIn: 'build'` 代替。 */
  buildMock?: boolean;
  /** 浏览器端 mock 的注入时机：false / 'build' / 'client'。@default `false` */
  mockIn?: boolean | 'build' | 'client';
  /** 是否输出 banner。 */
  enableBanner?: boolean;
}

/** `request` / `createMockAdapter` 消费的浏览器端 mock 请求结构。 */
export interface MockRequest {
  url: string;
  method?: string;
  query?: Record<string, string>;
  body?: any;
  headers?: Record<string, string>;
}

/** `request` 返回的浏览器端 mock 响应结构。 */
export interface MockResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
}
```

## 入口导出

除配置类型外，包还对外暴露以下运行时值。

### 根入口（`vite-plugin-mock-data`）

```ts
// 默认 / 具名插件工厂（同一函数）。
import pluginMockData from 'vite-plugin-mock-data';
import { pluginMockData, defineRouteValue, defineRouteConfig } from 'vite-plugin-mock-data';
```

| 导出 | 签名 | 说明 |
|------|------|------|
| 默认导出 / `pluginMockData` | `(opts: Options) => Plugin` | 插件工厂函数。 |
| `defineRouteValue` | `(value: RouteValue) => RouteValue` | 恒等辅助函数，为路由值提供 `RouteValue` 上下文类型。 |
| `defineRouteConfig` | `(config: RouteConfig) => RouteConfig` | 恒等辅助函数，为内联路由对象提供 `RouteConfig` 上下文类型。 |

#### 常量

以下常量从根入口再导出。普通用户通常只需 `VIRTUAL_MOCK_ROUTES`（`mockIn` 开启时导入的虚拟模块 id）；其余主要是为高级/互操作场景暴露，对应插件扫描文件的内部实现。

| 常量 | 取值 | 说明 |
|------|------|------|
| `PLUGIN_NAME` | 包名 | 插件展示名（取自 `package.json`）。 |
| `VIRTUAL_MOCK_ROUTES` | `'virtual:mock-routes'` | 承载文件路由清单与编译路由选项的虚拟模块 id。 |
| `MOCK_CACHE_DIR` | `'.vite-plugin-mock-data'` | 转译临时文件的缓存目录名（位于 `node_modules` 下）。 |
| `MOCK_ROUTE_GLOB` | `'**/*.{js,mjs,json,ts,mts}'` | 扫描 mock 文件用的 glob。 |
| `MOCK_TEMP_SUFFIX` | `` `-${PLUGIN_NAME}.mjs` `` | 转译临时文件后缀。 |
| `MOCK_IGNORE_GLOB` | `` `**/*${MOCK_TEMP_SUFFIX}` `` | 扫描时忽略临时文件用的 glob。 |

### 子路径入口

| 导入路径 | 导出 | 签名 | 说明 |
|----------|------|------|------|
| `vite-plugin-mock-data/mock-client` | `request` | `(req: MockRequest) => Promise<MockResponse>` | 浏览器端请求函数，将 `MockRequest` 与 `virtual:mock-routes` 携带的路由做匹配。需 `mockIn`。 |
| `vite-plugin-mock-data/mock-client` | `mockRoutes` | `MockClientRoute[]` | 装载时由 `normalizeRoutes` 编译好的客户端路由表（已编入 `base` 前缀）；为空时 `createMockAdapter` 返回 `undefined`。 |
| `vite-plugin-mock-data/axios-adapter` | `createMockAdapter` | `(opts?: MockAdapterOptions) => AxiosAdapter \| undefined` | 返回基于 `request` 的 axios adapter，让打包后的静态页面或 dev 页面都能通过 axios 走 mock 数据；路由表为空时返回 `undefined`。需 `mockIn`。 |
