
::: danger This is Vite 1.x – 6.x LEGACY documentation archive
- Corresponds to: **vite-plugin-reverse-proxy ≤ 1.x**.
- Bundler covered: Rollup + esbuild. **Does NOT apply to Vite 8+ Rolldown**. See current docs:
  - Latest English docs: [/guide/introduction](/guide/introduction)
  - 最新中文文档：[/zh/guide/introduction](/zh/guide/introduction)
:::
# vite-plugin-reverse-proxy (legacy)

[![npm package](https://nodei.co/npm/vite-plugin-reverse-proxy.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/vite-plugin-reverse-proxy)

> Serve a script with the **classic (`text/javascript`, non-module) MIME type** instead of Vite's default ES module form, while still automatically injecting the Vite dev server's `@vite/client` HMR runtime and an optional preamble bootloader.
>
> Typical use cases: third-party host pages (CMS backends, legacy iframes, Chrome extension content scripts, Qt web views) that embed your app via a plain `<script src="http://localhost:5173/app.js">` tag and cannot consume ESM / `type="module"` endpoints at all. This plugin acts as the adapter so those legacy hosts still get full Vite HMR support during dev.

[![NPM version](https://img.shields.io/npm/v/vite-plugin-reverse-proxy.svg?style=flat)](https://npmjs.org/package/vite-plugin-reverse-proxy)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-reverse-proxy.svg?style=flat)](https://npmjs.org/package/vite-plugin-reverse-proxy)
[![Node version](https://img.shields.io/node/v/vite-plugin-reverse-proxy.svg?style=flat)](https://npmjs.org/package/vite-plugin-reverse-proxy)

## How it works

When an incoming `load()` id matches one of your declared `targets` keys (e.g. `/app.js`), the plugin returns a **classic (non-module) JS shim / bootloader** that:

1. Injects `<script id="clientCode" type="module" src="/@vite/client">` first in `<head>` — this is Vite's HMR + error overlay runtime.
2. Optionally inserts an extra `<script id="preambleCode" type="module">` before the client script (useful for polyfills, global bridge init, rewriting `__BASE__`, etc.).
3. Finally creates `mainScript.type = 'module'` pointing at your real source entry (`src/main.jsx` etc.) and appends it to `<body>`.

Because the HMR client is loaded as a standard ES module the full Vite dev pipeline still works; the outer script you linked (`/app.js`) is just the ES-module **assembler**, and any host that can execute normal `<script>` tags can consume it.

::: warning Dev only / 仅开发环境
- During production builds (`configResolved.isProduction === true`) `load()` returns `undefined` immediately — the plugin has **zero effect on the output**. Ship your final bundle as ESM / UMD / IIFE normally.
- Vite often binds to `::` (IPv6 loopback) by default; if your third-party page opens on `127.0.0.1` pin `vite.config.server.host = '127.0.0.1'` to avoid cross-family connection failures.
:::

## Installation

::: code-group

```bash [npm]
npm add vite-plugin-reverse-proxy -D
```

```bash [pnpm]
pnpm add vite-plugin-reverse-proxy -D
```

```bash [yarn]
yarn add vite-plugin-reverse-proxy -D
```

:::

## Usage

### Basic: expose `/app.js` that bootstraps `src/main.jsx`

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import reverseProxy from 'vite-plugin-reverse-proxy';

export default defineConfig({
  plugins: [
    react(),
    reverseProxy({
      targets: {
        // key   = the URL external hosts will link to (leading slash is required)
        // value = your real entry module, relative to Vite project root
        '/app.js': 'src/main.jsx',
      },
    }),
  ],
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
});
```

Now any external host can embed a plain classic script link and still get **Vite HMR**:

```html
<!-- In a different domain / legacy CMS page / iframe -->
<script src="http://127.0.0.1:5173/app.js"></script>
```

### Multiple proxied endpoints

```ts
reverseProxy({
  targets: {
    '/widget/a.js': 'src/widgets/a.ts',
    '/widget/b.js': 'src/widgets/b.tsx',
    '/admin.js':   'src/entries/admin.tsx',
  },
}),
```

### Preamble (polyfill / global bridge init)

`preambleCode` runs **before** your main module but **after** the HMR client is wired up:

```ts
reverseProxy({
  targets: {
    '/embed.js': 'src/embed.ts',
  },
  // Example: legacy host exposes window.__HOST__ on its jQuery global;
  // we lift it into a well-known window object so the ESM bundle can read it.
  // The placeholder __BASE__ is replaced at runtime with vite's configured `base`.
  preambleCode: `
    window.__EMBED_ENV__ = {
      host: window.__HOST__ || location.origin,
      version: '1.0.0',
    };
  `,
}),
```

## Options

| Field | Type | Default | Description |
|---|---|---|---|
| `targets` | `Record<string, string>` | **required** | Map of `external URL → real entry module`. The key must start with `/` (query/hash are stripped before lookup); the value is the source entry path relative to the Vite project root. |
| `preambleCode?` | `string` | `undefined` | Extra module script (injected before main, after client) for polyfills, global bridge setup, env bootstrapping, router hooks. Supports the `__BASE__` placeholder which is substituted with vite's `base` at injection time. |

## Vite 8 + Rolldown compatibility

This plugin is **dev-only** — it never touches the build output. It therefore has zero interaction with Vite 8's new Rolldown bundler: as long as Vite's dev server exposes `/@vite/client` and module scripts, the bootloader assembly strategy keeps working unchanged across future bundler swaps.

The real entries you list in `targets` still go through the full dev transform pipeline (`@vitejs/plugin-react`, TS transforms, HMR accept, CSS module resolution, etc.) with no side effects.

## Matching example in this repo

See `examples/vite8-reverse-proxy/test/dev.test.ts` for the end-to-end dev server integration test that asserts:
1. `GET /app.js` → 200, `Content-Type: application/javascript`
2. Response includes the client bootloader code (`id="clientCode"` + `src="/@vite/client"`)
3. Response includes the `preambleCode` injection branch
4. `mainScript.src` correctly points to `/src/main.ts` (the real source entry)
