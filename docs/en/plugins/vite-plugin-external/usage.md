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

> Replaces listed imports with an absolute ESM CDN URL and, in build, automatically injects `<link rel="modulepreload">` tags into `index.html`, so the browser starts prefetching the CDN modules on first paint.

```js
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    react({ jsxRuntime: 'classic' }),
    pluginExternal({
      externals(libName) {
        if (libName === 'react') return 'https://esm.sh/react@19.3.1';
        if (libName === 'react-dom/client') return 'https://esm.sh/react-dom@19.3.1/client';
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
<script src="//unpkg.com/react@16.12.0/umd/react.development.js"></script>
<script src="//unpkg.com/react-dom@16.12.0/umd/react-dom.development.js"></script>
```

`index.html` for production
```html
<script src="//g.alicdn.com/linkdesign/lib/1.0.1/~react.js"></script>
```

vite.config.mjs
```js
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    pluginExternal({
      // Production defaults: private CDN prefix $linkdesign.* (React 16.12, key react-dom)
      externals: {
        react: '$linkdesign.React',
        'react-dom': '$linkdesign.ReactDOM',
        'prop-types': '$linkdesign.PropTypes'
      },
      // Development override: unpkg UMD global names
      development: {
        externals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'prop-types': 'PropTypes'
        },
      },
    }),
  ],
});
```

## Adjusting Build Strategies

> Setting `interop: 'auto'` makes the build config hook **declaratively override `build.rolldownOptions.external` with an always-false function** (without clearing it in place on the user object), forcing every named external to go through the stash-file CJS shim (`module.exports = <globalName>;`) and be bundled by Rolldown as a normal in-bundle dependency.
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

## Excluding Dependencies During Build

> Typical scenario: authoring a Node.js CLI or a backend library — you want `node_modules` dependencies and Node built-ins *stripped* from the bundle, but you don't need the browser-oriented global names / CDN stashes. Two shortcuts exist:
> - `nodeBuiltins: true` — also mark all Node built-ins (`fs`, `path`, `node:stream/*`, …) external (build phase only; dev browsers never resolve them anyway).
> - `externalizeDeps: (string | RegExp)[]` — list every dep that should not be bundled (dev and build; matches are treated as "pure external", no global-name / CDN shim is emitted). In dev Vite rewrites such a bare specifier to `/@id/<specifier>`, so a browser page needs an import map with those prefixed keys, supplied by you — the plugin injects nothing for `externalizeDeps` (see [Import Map Instead of CDN URLs](#import-map-instead-of-cdn-urls) for the build-only switch that emits a map for URL-valued `externals`).
>
> (Developer note: this section used to be titled "Build-only deps exclusion (no global name / no stash shim)". It was renamed so the Options Reference anchors `nodeBuiltins` and `externalizeDeps` land on the same section.)

vite.config.mjs
```js
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';
import { globSync } from 'tinyglobby';
import { dependencies } from './package.json' with { type: 'json' };

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

## Import Map Instead of CDN URLs

> Typical scenario: the app already externalises a handful of ESM CDN URLs and you want to move one dependency to another host without rebuilding. `importmap: true` keeps the bare specifier in the build bundle and puts every address into an import map in the build HTML.
>
> What the plugin does (**build only**):
> - `resolveId` returns `{ id: '<specifier>', external: 'absolute' }` for every ES-valued entry of `externals`, so the build chunk keeps `import x from '<specifier>'`.
> - `transformIndexHtml` injects `<script type="importmap">{"imports": {…}}</script>` — keys are the bare specifiers — plus one `<link rel="modulepreload" crossorigin>` per URL. Vite hoists the map ahead of the first `<script type="module">` / `<link rel="modulepreload">` itself.
> - stash files are still written; the switch only changes what build resolves to and what the HTML carries.
> - dev is unaffected: CDN externals still go through the DepsOptimizer, and the dev page gets neither a map nor the preload tags.
>
> Constraints: works for any `externals` shape that resolves to an ES URL (a URL string or `{ format: 'es', … }`). Pure externals (`true`) produce no map entry, and entries whose value is a global variable name still go through the IIFE stash; the switch is plugin-level, not overridable per mode.

vite.config.mjs
```js
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    pluginExternal({
      externals: {
        lodash: 'https://esm.sh/lodash@4.18.1',
        dayjs: 'https://esm.sh/dayjs@1.11.23',
      },
      importmap: true,
    }),
  ],
});
```

The head of the built `index.html` afterwards:

```html
<link rel="modulepreload" crossorigin href="https://esm.sh/lodash@4.18.1">
<link rel="modulepreload" crossorigin href="https://esm.sh/dayjs@1.11.23">
<script type="importmap">{"imports": {"lodash": "https://esm.sh/lodash@4.18.1", "dayjs": "https://esm.sh/dayjs@1.11.23"}}</script>
```
