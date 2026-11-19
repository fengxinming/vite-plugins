# Option Reference

## `routes`

- **Type**: `RouteConfig | Array<RouteConfig | string> | string`
- **Required**: `false`

The mock routes to add to the dev server. It accepts three shapes:

- a directory path — every `.ts` / `.js` / `.mjs` file under it is loaded and its default export merged in;
- an array mixing directory paths and inline `RouteConfig` objects;
- an inline `RouteConfig` object.

```ts
routes: './mock'
routes: ['./mock', './mock2']
routes: { '/api/x': { ok: true } }
```

## `fastifyOptions`

- **Type**: `FastifyServerOptions`
- **Required**: `false`

Initial options passed to the underlying fastify instance (logger, body limit, etc.). See the [fastify Server reference](https://fastify.dev/docs/latest/Reference/Server/).

```ts
mockData({
  fastifyOptions: { logger: true }
})
```

## `cwd`

- **Type**: `string`
- **Required**: `false`
- **Default**: `process.cwd()`

Working directory. Used to resolve relative file paths in route files and as the root for `@fastify/static` (the `reply.sendFile()` capability).

## `cacheDir`

- **Type**: `string`
- **Required**: `false`
- **Default**: `${cwd}/node_modules/.vite-plugin-mock-data`

Directory where the plugin writes compiled route files (route files are transpiled on load).

Relative paths are resolved against `cwd` (not `process.cwd()`); absolute paths are used as-is.

## `logLevel`

- **Type**: `LogLevel`
- **Required**: `false`

Logging verbosity for the plugin.

## `isAfter`

- **Type**: `boolean`
- **Required**: `false`
- **Default**: `false`

If `true`, mock routes are matched **after** Vite's internal middlewares are installed, instead of before.

## `base`

- **Type**: `string`
- **Required**: `false`
- **Default**: follows Vite's `base` (Vite defaults to `/`, which normalizes to no prefix)

The path prefix for mock routes, prepended to **defined routes**: `base: '/app'` + `GET /api/users` → `/app/api/users`.

The same value is used in two places:

- **dev server (server side)**: as fastify's `register(..., { prefix })` prefix for every route;
- **browser side**: when `mockIn` is enabled, the value is sent through the `base` export of `virtual:mock-routes` and compiled into the route regexps by `normalizeRoutes`.

Resolution and normalization:

- When unset (`undefined` / `null`), it falls back to Vite's resolved `base`;
- A leading `./` becomes `/`, and trailing slashes are removed. So `'./'` and `'/'` both normalize to an empty string (no prefix), and `'/app/'` normalizes to `'/app'`;
- On the client, both ways of reaching a prefixed path work: set axios `baseURL: '/app'` and request `/api/users` (`axios.getUri` joins them into `/app/api/users`), or write the full `/app/api/users` directly;
- This is a **route** prefix, not axios's `baseURL`: the latter only affects how the request url is built and is already handled by `axios.getUri(config)` inside the adapter, so it should not be repeated in `base`.

```ts
mockData({
  routes: './mock',
  mockIn: 'client',
  base: '/app'
})
```

## `mockIn`

- **Type**: `boolean | 'build' | 'client'`
- **Required**: `false`
- **Default**: `false`

When the browser-side mock (`vite-plugin-mock-data/mock-client` and `vite-plugin-mock-data/axios-adapter`) is injected:

| Value | `vite build` | dev / serve |
|-------|--------------|-------------|
| `false` (default) | not injected | not injected |
| `'build'` | injected | not injected |
| `'client'` | injected | injected |

`'client'` is the superset: pick it when the browser needs mock at all; pick `'build'` to only ship mock in the static output. `true` is treated as `'build'`, `false` as not injected.

- Only affects the browser-side chain; the dev-server mock comes from the fastify middleware and is unaffected;
- Only file-based `routes` (a directory or an array of directories) are supported; inline `RouteConfig` objects are dev-only and are not bundled;
- For the browser to actually use the mock, an entry must statically import `vite-plugin-mock-data/axios-adapter` (which pulls in `mock-client` → `virtual:mock-routes`); otherwise the bundle contains no route table at all.

```ts
mockData({
  routes: './mock',
  mockIn: 'client'
})
```

## `buildMock` (deprecated)

- **Type**: `boolean`
- **Required**: `false`
- **Default**: `false`

**@deprecated** Use `mockIn: 'build'` instead. Kept as a compatibility alias: only applied when `mockIn` is not set, `true` is equivalent to `mockIn: 'build'`, and it will be removed in the next major release.

## `enableBanner`

- **Type**: `boolean`
- **Required**: `false`

Whether to print the plugin banner on startup.

## TypeScript Definitions

```ts
import type { FastifyReply, FastifyRequest, FastifyServerOptions, RouteHandlerMethod } from 'fastify';
import type { LogLevel } from 'vp-runtime-helper';

/** Function handler in fastify style `(request, reply)`, passed through as-is. */
export type MockHandler = RouteHandlerMethod;

/** Any JSON-serializable static data, usable directly at the route top level. */
export type MockData =
  | string
  | number
  | boolean
  | null
  | MockData[]
  | { [key: string]: MockData };

/** A route value: a function handler or static data. */
export type RouteValue = MockHandler | MockData;

/** Fastify request object handed to a dev-server function handler. */
export type DevRequest = FastifyRequest;

/** Fastify reply object handed to a dev-server function handler. */
export type DevReply = FastifyReply;

export interface RouteConfig {
  [route: string]: RouteValue;
}

export interface Options {
  /** The directory to serve files from. @default `process.cwd()` */
  cwd?: string;
  /** Cache directory for compiled files. @default `${cwd}/node_modules/.vite-plugin-mock-data` */
  cacheDir?: string;
  /** Log level. */
  logLevel?: LogLevel;
  /** If `true`, mock routes are matched after internal middlewares are installed. @default `false` */
  isAfter?: boolean;
  /** Initial options of `fastify`. */
  fastifyOptions?: FastifyServerOptions;
  /** Initial list of mock routes, or a directory / list of directories. */
  routes?: RouteConfig | Array<RouteConfig | string> | string;
  /** Path prefix for mock routes; falls back to Vite's base when unset. */
  base?: string;
  /** @deprecated Use `mockIn: 'build'` instead. */
  buildMock?: boolean;
  /** When the browser-side mock is injected: false / 'build' / 'client'. @default `false` */
  mockIn?: boolean | 'build' | 'client';
  /** Whether to output the banner. */
  enableBanner?: boolean;
}

/** Browser-side mock request shape consumed by `request` / `createMockAdapter`. */
export interface MockRequest {
  url: string;
  method?: string;
  query?: Record<string, string>;
  body?: any;
  headers?: Record<string, string>;
}

/** Browser-side mock response shape returned by `request`. */
export interface MockResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
}
```

## Entry Exports

Beyond the configuration types, the package exposes runtime values.

### Root entry (`vite-plugin-mock-data`)

```ts
// Default / named plugin factory (same function).
import pluginMockData from 'vite-plugin-mock-data';
import { pluginMockData, defineRouteValue, defineRouteConfig } from 'vite-plugin-mock-data';
```

| Export | Signature | Description |
|--------|-----------|-------------|
| default / `pluginMockData` | `(opts: Options) => Plugin` | The plugin factory. |
| `defineRouteValue` | `(value: RouteValue) => RouteValue` | Identity helper that gives a route value contextual typing (`RouteValue`). |
| `defineRouteConfig` | `(config: RouteConfig) => RouteConfig` | Identity helper that gives an inline route object contextual typing (`RouteConfig`). |

#### Constants

The following constants are re-exported from the root entry. Only `VIRTUAL_MOCK_ROUTES` is normally needed by users (it is the virtual module id imported when `mockIn` is enabled); the rest are exposed mainly for advanced/interop use and mirror the plugin's file-scanning internals.

| Constant | Value | Description |
|----------|-------|-------------|
| `PLUGIN_NAME` | package name | The plugin's display name (from `package.json`). |
| `VIRTUAL_MOCK_ROUTES` | `'virtual:mock-routes'` | Virtual module id carrying the file-route manifest + compiled route options. |
| `MOCK_CACHE_DIR` | `'.vite-plugin-mock-data'` | Cache directory name (under `node_modules`) for transpiled temp files. |
| `MOCK_ROUTE_GLOB` | `'**/*.{js,mjs,json,ts,mts}'` | Glob used to scan mock files. |
| `MOCK_TEMP_SUFFIX` | `` `-${PLUGIN_NAME}.mjs` `` | Suffix for transpiled temp files. |
| `MOCK_IGNORE_GLOB` | `` `**/*${MOCK_TEMP_SUFFIX}` `` | Glob used to ignore temp files while scanning. |

### Subpath entries

| Import path | Export | Signature | Description |
|-------------|--------|-----------|-------------|
| `vite-plugin-mock-data/mock-client` | `request` | `(req: MockRequest) => Promise<MockResponse>` | Browser-side request function that matches a `MockRequest` against the routes carried by `virtual:mock-routes`. Requires `mockIn`. |
| `vite-plugin-mock-data/mock-client` | `mockRoutes` | `MockClientRoute[]` | The client route table compiled by `normalizeRoutes` at load time (with the `base` prefix baked in); when empty, `createMockAdapter` returns `undefined`. |
| `vite-plugin-mock-data/axios-adapter` | `createMockAdapter` | `(opts?: MockAdapterOptions) => AxiosAdapter \| undefined` | Returns an axios adapter backed by `request`, so bundled static pages or dev pages can serve mock data through axios; returns `undefined` when the route table is empty. Requires `mockIn`. |
