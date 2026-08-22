# vite-plugin-external

[![npm package](https://nodei.co/npm/vite-plugin-external.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/vite-plugin-external)

> Excludes listed modules both at runtime and in production bundles.
> Target scope: **Vite 8.x** (current rewrite, built on top of the new Rolldown bundler). For Vite 1–6 users see the legacy docs archive.

[![NPM version](https://img.shields.io/npm/v/vite-plugin-external.svg?style=flat)](https://npmjs.org/package/vite-plugin-external)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-external.svg?style=flat)](https://npmjs.org/package/vite-plugin-external)
[![Node version](https://img.shields.io/node/v/vite-plugin-external.svg?style=flat)](https://npmjs.org/package/vite-plugin-external)

## Overview

### How it works in Vite 8 + Rolldown

This version is a **full rewrite** targeting Vite 8 and its built-in Rolldown bundler. Regardless of phase (dev serve / build), every user-facing external shape (object map / function / string / RegExp / array / `true`) is first **normalised** to a single decision-hook signature (see [Options Reference → `ExternalFn` type](/plugins/vite-plugin-external/options#externalfn-type)), so the three entry points share the exact same decision logic — no more phase drift:

1. **Dev phase — DepsOptimizer pre-bundling**: a custom Rolldown plugin is injected so that "named" externals (e.g. `react → React`, which carry a global name or CDN URL) resolve to on-disk *stash files* the plugin writes. Pure externals (string / regex / `true` / function returning `true`) are simply forwarded to Rolldown's native `external` flag.
2. **Dev phase — browser request**: resolves proceed through Vite's normal middleware layer.
3. **Build phase**: all externals are wired into `build.rolldownOptions.external`; for ES-format CDN externals a `<link rel="modulepreload">` is injected via `transformIndexHtml` so the browser starts prefetching the CDN modules on first paint.

> The old Vite ≤6 dual-path design (`alias` for dev + `rollupOptions` for build + `interop: 'auto'` compatibility switch + `rollback: true` escape hatch) has been archived. If you need the historical implementation please consult the [Legacy archive (Vite 1–6) → vite-plugin-external](/legacy/plugins/vite-plugin-external/quick-start).

## Installation

::: code-group

```bash [npm]
npm add vite-plugin-external
```
```bash [pnpm]
pnpm add vite-plugin-external
```
```bash [yarn]
yarn add vite-plugin-external
```

:::

**IIFE build (global variable injected via an HTML `<script>` tag)**

```js
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    pluginExternal({
      externals: {
        jquery: '$',
        vue: 'Vue',
        react: 'React',
        'react-dom/client': 'ReactDOM',
      },
    }),
  ],
  build: {
    rolldownOptions: {
      output: {
        format: 'iife',
      },
    },
  },
});
```

**Function-style externals (dynamic global name resolution)**

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    react({ jsxRuntime: 'classic' }),
    pluginExternal({
      externals(libName) {
        if (libName === 'react') return 'React';
        if (libName === 'react-dom/client') return 'ReactDOM';
      },
    }),
  ],
  build: {
    rolldownOptions: {
      output: {
        format: 'iife',
      },
    },
  },
});
```

**ESM build (re-export from an absolute CDN ESM URL)**

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    react({ jsxRuntime: 'classic' }),
    pluginExternal({
      externals: {
        react: 'https://esm.sh/react@18.3.1',
        'react-dom/client': 'https://esm.sh/react-dom@18.3.1',
      },
    }),
  ],
});
```

## FAQ

* Q: After editing `externals` during dev the page no longer loads?
* A: Named externals stash files are cached under `./node_modules/.vite_external`. Delete that folder to force a cache rebuild (it lives next to Vite's own `.vite` cache, so a one-liner `rm -rf node_modules/.vite*` cleans both).

## Historical changelog

* **8.0.2**
  * Added `"type": "module"` to package.json

* **8.0.1**
  * Removed deprecated `rollback` option, updated docs

* **8.0.0**
  * This Vite-8-compatible rewrite is based on the v6.2.0 codebase but reworks every pipeline for Rolldown + the new DepsOptimizer.
