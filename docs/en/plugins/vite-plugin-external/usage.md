# Usage Examples

## Basic usage

vite.config.mjs
```js
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    pluginExternal({
      externals: {
        jquery: '$',
        react: 'React',
        'react-dom/client': 'ReactDOM',
        vue: 'Vue',
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

## Dynamic global-name resolution

```js
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
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

## Dynamic ESM CDN URLs

> Replaces listed imports with an absolute ESM CDN URL and automatically injects `<link rel="modulepreload">` tags into `index.html`, so the browser starts prefetching the CDN modules on first paint.

```js
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    react({ jsxRuntime: 'classic' }),
    pluginExternal({
      externals(libName) {
        if (libName === 'react') return 'https://esm.sh/react@18.3.1';
        if (libName === 'react-dom/client') return 'https://esm.sh/react-dom@18.3.1';
      },
    }),
  ],
});
```

## Multi-mode Configuration

> Dev (unpkg UMD) and prod (private CDN prefix) often need different global names / URLs. Use the `development` / `production` fields as per-mode `BasicOptions` overrides (see [Options reference → `[mode: string]` index signature](/plugins/vite-plugin-external/options#mode-string-index-signature)).
>
> (Developer note: "Multi-mode configuration" vs "per-mode overrides" refer to the same feature; the title chosen here matches the cross-document anchor used from the Options Reference page.)

`index.html` for development
```html
<script src="//unpkg.com/react@18.3.1/umd/react.development.js"></script>
<script src="//unpkg.com/react-dom@18.3.1/umd/react-dom.development.js"></script>
```

`index.html` for production
```html
<script src="//g.alicdn.com/linkdesign/lib/1.0.1/~react.js"></script>
<script src="//g.alicdn.com/linkdesign/lib/1.0.1/~react-dom.js"></script>
```

vite.config.mjs
```js
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    pluginExternal({
      // Production defaults: private CDN prefix $linkdesign.*
      externals: {
        react: '$linkdesign.React',
        'react-dom/client': '$linkdesign.ReactDOM',
      },
      // Development override: unpkg UMD global names
      development: {
        externals: {
          react: 'React',
          'react-dom/client': 'ReactDOM',
        },
      },
    }),
  ],
});
```

## Adjusting Build Strategies

> Setting `interop: 'auto'` **clears `build.rolldownOptions.external` during the build phase**, forcing every named external to go through the stash-file CJS shim (`module.exports = <globalName>;`) and be bundled by Rolldown as a normal in-bundle dependency.
>
> Use case: you notice the IIFE output still wraps `require('react')` at the top level instead of rewriting it to `$linkdesign.React`. Toggling `interop: 'auto'` makes Rolldown bundle the 1-line CJS shim together with the rest of the app — Rolldown IIFE wrapping has always handled that shape correctly.
>
> **Note**: Vite ≤6 used to also route dev through `alias` when `interop` was set. This rewrite removes that behaviour; `interop` now affects the **build phase only**. The old behaviour is archived at [Legacy docs (Vite 1–6) → Packing strategy section](/legacy/plugins/vite-plugin-external/usage#adjust-packing-strategy).

vite.config.mjs

```js
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    pluginExternal({
      interop: 'auto',
      externals: {
        react: '$linkdesign.React',
        'react-dom/client': '$linkdesign.ReactDOM',
        'prop-types': '$linkdesign.PropTypes',
      },
    }),
  ],
  build: {
    minify: false,
    rolldownOptions: {
      output: {
        format: 'iife',
      },
    },
  },
});
```

## Solving IIFE Build Issues

> Even when Rolldown receives a correct `output.globals`, in rare cases the IIFE wrapper still emits a raw `require('react')` at the top that never gets rewritten to a global access (see [rollup/rollup#3188](https://github.com/rollup/rollup/issues/3188)).
>
> Use the `externalGlobals` callback: it receives a pre-compiled `globals(id)` resolver (semantically identical to Rolldown `output.globals`) which you forward into `@rolldown/plugin-external-globals` (or its Rollup ancestor). The returned Rolldown plugin is **prepended** to `rolldownOptions.plugins` so its transform runs **before** Rolldown's built-in globals handling.
>
> **Important**: The current API is a *function* `(globals) => Rolldown.Plugin`, not a plugin instance directly. Old code that passed the `rollup-plugin-external-globals` instance directly must wrap it in a one-line callback.
>
> (Developer note: this section used to bear the longer title "Fixing IIFE top-level require → global rewrite (Rolldown/Rollup Issue #3188)". It was shortened so the Options Reference anchor `#solving-iife-build-issues` lands exactly here.)

```js
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';
import externalGlobals from '@rolldown/plugin-external-globals';

export default defineConfig({
  plugins: [
    pluginExternal({
      // Required shape: a callback. `globals(id)` behaves exactly like output.globals.
      externalGlobals: (globals) => externalGlobals(globals),
      externals: {
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

## Excluding Dependencies During Build

> Typical scenario: authoring a Node.js CLI or a backend library — you want `node_modules` dependencies and Node built-ins *stripped* from the bundle, but you don't need the browser-oriented global names / CDN stashes. Two shortcuts exist:
> - `nodeBuiltins: true` — also mark all Node built-ins (`fs`, `path`, `node:stream/*`, …) external (build phase only; dev browsers never resolve them anyway).
> - `externalizeDeps: (string | RegExp)[]` — list every dep that should not be bundled (build phase only; matches are treated as "pure external", no global-name / CDN shim is emitted).
>
> (Developer note: this section used to be titled "Build-only deps exclusion (no global name / no stash shim)". It was renamed so the Options Reference anchors `nodeBuiltins` and `externalizeDeps` land on the same section.)

vite.config.mjs
```js
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';
import { globSync } from 'tinyglobby';
import { dependencies } from './package.json';

export default defineConfig({
  plugins: [
    pluginExternal({
      nodeBuiltins: true,
      externalizeDeps: Object.keys(dependencies),
    }),
  ],
  build: {
    minify: false,
    lib: {
      formats: ['es', 'cjs'],
      entry: globSync('src/*.js'),
      fileName(format, entryName) {
        return entryName + (format === 'es' ? '.mjs' : '.js');
      },
    },
  },
});
```
