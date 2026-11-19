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

1. **Dev phase — DepsOptimizer pre-bundling**: a custom Rolldown plugin is injected so that "named" externals (e.g. `react → React`, which carry a global name or CDN URL) resolve to on-disk *stash files* the plugin writes. Pure externals (string / regex / `true` / function returning `true`) are kept out of the pre-bundle and left as bare specifiers.
2. **Dev phase — browser request**: resolves proceed through Vite's normal middleware layer.
3. **Build phase**: when the effective output format is `iife`/`umd`, externals are wired into `build.rolldownOptions.external` + `output.globals`; for `es`/`cjs` output the build config hook declaratively overrides `build.rolldownOptions.external` with an always-false function (without clearing it in place on the user object), so named externals are bundled through the stash shim. The effective format list mirrors Vite's `resolveBuildOutputs`, so `build.lib.formats` counts as well. ES-format CDN externals additionally get one `<link rel="modulepreload">` per resolved CDN module via `transformIndexHtml` — **build only**, so dev HTML never carries these tags. With `importmap: true` the build resolution target changes: the chunk keeps the bare import and `transformIndexHtml` injects `<script type="importmap">{"imports": …}</script>` plus one `<link rel="modulepreload" crossorigin>` per URL. Stash files are still written in this mode (dev pre-bundling and the tag list rely on them); the switch only changes what build resolves to and what the HTML carries.

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

## Prerequisite: provide the globals in `index.html`

Global-name externals (e.g. `react: 'React'`) only take effect if the global variable actually exists at runtime — the plugin rewrites the import to a global lookup, it does **not** download anything. Load the UMD builds in `index.html` first, and keep the `window` names aligned with the values in `externals`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>demo</title>
  <!-- CDN UMD builds provide window.React / window.ReactDOM -->
  <script crossorigin src="https://unpkg.com/umd-react/dist/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/umd-react/dist/react-dom.production.min.js"></script>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/index.tsx"></script>
</body>
</html>
```

The ESM CDN shape is the exception — nothing to add manually: in build the bundle imports the absolute CDN URLs directly and the plugin injects `<link rel="modulepreload">`. With `importmap: true` (see [Usage Example → Import Map Instead of CDN URLs](/plugins/vite-plugin-external/usage#import-map-instead-of-cdn-urls)) the addresses leave the bundle entirely and come from an injected `<script type="importmap">` instead.

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
        react: 'https://esm.sh/react@19.3.1',
        'react-dom/client': 'https://esm.sh/react-dom@19.3.1/client',
      },
    }),
  ],
});
```

## FAQ

* Q: After editing `externals` during dev the page no longer loads?
* A: Named externals stash files are cached under `./node_modules/.vite_external`. Delete that folder to force a cache rebuild (it lives next to Vite's own `.vite` cache, so a one-liner `rm -rf node_modules/.vite*` cleans both).

## Historical changelog
* **8.1.0**
  * Added `ExternalEsConfig` (`{ format: 'es', url, exports? }`) to `externals` values. `exports` may be `'auto'` (default), `'named'`, `'default'` or `'none'` and picks the generated re-export shim; unknown values and a missing `url` throw at stash time.
  * The build-time external gate now mirrors Vite's `resolveBuildOutputs`: `build.lib.formats` is consulted together with `build.rolldownOptions.output`, so lib builds that declare only `formats: ['iife' | 'umd']` keep native external + `output.globals`.
  * `apply` / `enforce` are read at plugin-factory time with defaults (`apply` excludes preview; `enforce` defaults to `'post'` and applies to the config plugin, while the resolve plugin stays pinned to `'pre'`). They are plugin-level fields and cannot be overridden per mode.
  * `externalizeDeps` is honored in dev as well as build; a hit dependency becomes a bare `/@id/<specifier>` request in dev, so the page needs an import map with those prefixed keys, supplied by you — the plugin injects a map only in build, and only when `importmap: true` (see [Usage → Import Map Instead of CDN URLs](/plugins/vite-plugin-external/usage#import-map-instead-of-cdn-urls)).
  * Added `importmap: true`: in **build**, CDN-valued `externals` keep the bare import and the addresses move into an injected `<script type="importmap">` plus one `<link rel="modulepreload" crossorigin>` per URL. Stash files are still written; dev resolution and HTML are unaffected.
  * Dev now honors `externals` for dependencies Vite pre-bundles, including the ones pulled in through `optimizeDeps.include` by other plugins: `externals` wins, so dev and build agree and `optimizeDeps.include` no longer needs to be maintained by hand.
  * Pure externals (`externals` returning `true`) now take effect in dev as well: the dependency is kept out of the pre-bundle instead of being packed into `deps/<name>.js`.
  * CSS and asset ids (`*.module.css`, plain CSS, `.wasm`, images, SFC-style requests) can be externalized in dev too; previously only bare package names were ever considered.
  * Fixed: an external id could be re-resolved to a real `node_modules` path before the output was written, so the bare import / CDN URL disappeared from the bundle. The id is now marked final.
  * Fixed: after editing `vite.config` and restarting dev, CDN externals lost their `<link rel="modulepreload">` tags; the build tag list comes from the in-memory stash instead of a restored cache file.
  * Fixed: the dev-time cache cleanup ran as an async hook and could race Vite's DepsOptimizer into reusing stale entries. It is synchronous now, and the dep list is deduplicated.
  * Stash metadata (`_metadata.json`) is written by a single debounced path and flushed when the dev server closes; the restart-restore step is gone.
  * Cache file names are Windows-safe and collision-free (`vp-runtime-helper@8.0.1` reworks `flattenId`).
  * Added dependency `@rolldown/pluginutils`.

* **8.0.3**
  * Support for two configuration attributes `'nodeBuiltins'` and `'externalizeDeps'` to be overridden multiple times in the specified mode

* **8.0.2**
  * Added `"type": "module"` to package.json

* **8.0.1**
  * Removed deprecated `rollback` option, updated docs

* **8.0.0**
  * This Vite-8-compatible rewrite is based on the v6.2.2 codebase but reworks every pipeline for Rolldown + the new DepsOptimizer.
