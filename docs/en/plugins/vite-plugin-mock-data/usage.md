# Usage

`vite-plugin-mock-data` adds mock APIs to the Vite dev server with a tiny config surface. Each mock route maps a request path to either static data or a function handler; everything is powered by a fastify instance embedded as a connect middleware, so unmatched requests keep flowing through Vite's normal middleware chain.

## Installation

See [Quick Start](./quick-start) for install instructions.

## Define routes in a directory

Point `routes` at a directory and export route objects from `.ts` / `.js` / `.mjs` files inside it:

`vite.config.ts`

```ts
import { defineConfig } from 'vite';
import mockData from 'vite-plugin-mock-data';

export default defineConfig({
  plugins: [
    mockData({
      routes: './mock'
    })
  ]
});
```

```txt
.
└── mock
    └── index.ts
```

```ts
export default {
  '/text': 'hello world',
  '/user': { id: 1, name: 'mock' }
};
```

You can also pass an array of directories, or mix directories with inline objects:

```ts
mockData({
  routes: ['./mock', './mock2']
})
```

## Route matching

Each key in a route object is a route matcher. The format is `"METHOD /path"`; when the method is omitted it defaults to `GET`. Multiple methods are separated by `/`, and `:param` marks a path parameter (fastify syntax).

| Key | Matches |
| --- | --- |
| `'/api/users'` | `GET /api/users` |
| `'GET /api/users'` | `GET /api/users` |
| `'POST /api/users'` | `POST /api/users` |
| `'GET/POST /api/users'` | `GET` **or** `POST` |
| `'/api/users/:id'` | `GET /api/users/1`, `/api/users/2`, ... |

## Route values

A route value is either **static data** (any non-function value) or a **function handler**. The plugin decides which one it is at runtime by checking `typeof value === 'function'` — no wrapper object, no extra fields.

### Static data

Any JSON-serializable value is sent as-is:

- **Objects and arrays** are serialized to JSON (`application/json`).
- **Primitives** (`string` / `number` / `boolean` / `null`) are converted with `String()` and sent as `text/plain`.

```ts
export default {
  '/text': 'hello world',           // → text/plain  "hello world"
  '/count': 42,                     // → text/plain  "42"
  '/flag': true,                    // → text/plain  "true"
  '/user': { id: 1, name: 'mock' }, // → application/json
  '/list': [1, 2, 3]                // → application/json
};
```

### Function handler

A function is passed through to fastify unchanged, using the native fastify `(request, reply)` signature. fastify supports both response styles:

- **return a value** from an `async` handler — it is auto-sent (objects become JSON);
- **call `reply.send()` / `reply.type()` yourself** for full control over status and headers.

```ts
export default {
  // echo the request body (auto-sent JSON)
  'POST /echo'(request, reply) {
    reply.send(request.body);
  },

  // return HTML with an explicit content-type
  '/page'(request, reply) {
    reply.type('text/html').send('<h1>Hello</h1>');
  },

  // async handler: the returned value is auto-sent
  '/async'(request, reply) {
    return { ok: true };
  }
};
```

### Serve a file from disk

The plugin registers `@fastify/static` rooted at `cwd`, so any function handler can serve a file with `reply.sendFile()`:

```ts
export default {
  '/package.json': async (request, reply) => {
    return reply.sendFile('package.json', process.cwd());
  }
};
```

### Unmatched requests fall through to Vite

Only matched mock routes are answered by the plugin. Any request that does not match a mock route continues down Vite's own middleware chain — static assets, module transform, SPA fallback, proxy, and so on. The plugin itself never sends a `404`; that decision stays with Vite.

## Inline routes

Instead of a directory you can pass route objects directly in the config:

```ts
import { defineConfig } from 'vite';
import mockData from 'vite-plugin-mock-data';

export default defineConfig({
  plugins: [
    mockData({
      routes: {
        '/text': 'hello',
        '/user': { id: 1 },
        'POST /echo'(request, reply) {
          reply.send(request.body);
        }
      }
    })
  ]
});
```

## TypeScript

Import the exported types for full autocompletion:

```ts
import type { RouteConfig } from 'vite-plugin-mock-data';

const routes: RouteConfig = {
  '/user': { id: 1 },
  '/echo'(request, reply) {
    reply.send(request.body);
  }
};

export default routes;
```

See [Option Reference](./options) for the full `Options` type and every configuration field.
