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
- **Default**: `${cwd}/node_modules/.vite_mock_data`

Directory where the plugin writes compiled route files (route files are transpiled on load).

## `logLevel`

- **Type**: `LogLevel`
- **Required**: `false`

Logging verbosity for the plugin.

## `isAfter`

- **Type**: `boolean`
- **Required**: `false`
- **Default**: `false`

If `true`, mock routes are matched **after** Vite's internal middlewares are installed, instead of before.

## `enableBanner`

- **Type**: `boolean`
- **Required**: `false`

Whether to print the plugin banner on startup.

## TypeScript Definitions

```ts
import type { FastifyServerOptions, RouteHandlerMethod } from 'fastify';
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

export interface RouteConfig {
  [route: string]: RouteValue;
}

export interface Options {
  /** The directory to serve files from. @default `process.cwd()` */
  cwd?: string;
  /** Cache directory for compiled files. @default `${cwd}/node_modules/.vite_mock_data` */
  cacheDir?: string;
  /** Log level. */
  logLevel?: LogLevel;
  /** If `true`, mock routes are matched after internal middlewares are installed. @default `false` */
  isAfter?: boolean;
  /** Initial options of `fastify`. */
  fastifyOptions?: FastifyServerOptions;
  /** Initial list of mock routes, or a directory / list of directories. */
  routes?: RouteConfig | Array<RouteConfig | string> | string;
  /** Whether to output the banner. */
  enableBanner?: boolean;
}
```
