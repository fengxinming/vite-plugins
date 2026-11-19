# vite-plugin-external

[![npm package](https://nodei.co/npm/vite-plugin-external.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/vite-plugin-external)

[![NPM version](https://img.shields.io/npm/v/vite-plugin-external.svg?style=flat)](https://npmjs.org/package/vite-plugin-external)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-external.svg?style=flat)](https://npmjs.org/package/vite-plugin-external)
[![Node version](https://img.shields.io/node/v/vite-plugin-external.svg?style=flat)](https://npmjs.org/package/vite-plugin-external)

> Excludes specified module dependencies from runtime code and built bundles.
> Vite >= 8.0


## Documentation

For detailed usage instructions and API references, please visit the official documentation:

👉 [View Full Documentation](https://fengxinming.github.io/vite-plugins/plugins/vite-plugin-external/quick-start)

## Quick Start

### Prerequisite: provide the globals in `index.html`

Global-name externals (e.g. `react: 'React'`) only take effect if the global variable actually exists at runtime — the plugin rewrites the import to a global lookup, it does **not** download anything. So load the UMD builds in `index.html` **before** writing the config, and keep the `window` names aligned with the values in `externals`:

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

The same rule applies to per-mode (`development` / `production`) overrides: every mode's global names must exist on `window` in that environment. Externals whose value is an ESM CDN URL are the exception — nothing to add manually: in a build the bundle imports the absolute CDN URLs directly and the plugin injects `<link rel="modulepreload">` for first-paint prefetching; with `importmap: true` (example 5 below) the addresses move out of the bundle into an injected `<script type="importmap">`.

**1. IIFE build with global variables (application build)**

```js
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    pluginExternal({
      externals: {
        react: 'React',
        'react-dom': 'ReactDOM',
        'react-dom/client': 'ReactDOM'
      }
    })
  ],
  build: {
    rolldownOptions: {
      output: {
        format: 'iife'
      }
    }
  }
});
```

**2. Function-style externals (dynamic mapping, lib build)**

`(source, importer, isResolved)` — return a string (global name / CDN URL), an `ExternalEsConfig` (`{ format: 'es', url, exports? }`, where `exports` is `'auto' | 'named' | 'default' | 'none'`), `true` (pure external), or a falsy value to let it resolve normally. IIFE lib builds need `build.lib.name`:

```js
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    pluginExternal({
      externals(source) {
        if (source.startsWith('@scope/')) {
          const name = source.split('/').pop();
          return `Scope${name.charAt(0).toUpperCase()}${name.slice(1)}`;
        }
        if (source === 'react') return 'React';
        if (source === 'react-dom/client') return 'ReactDOM';
        return null;
      }
    })
  ],
  build: {
    lib: {
      entry: 'src/main.tsx',
      formats: ['iife'],
      name: 'ScopedApp'
    }
  }
});
```

**3. ESM CDN URLs (auto `<link rel="modulepreload">` injection)**

```js
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    pluginExternal({
      externals: {
        react: 'https://esm.sh/react@19.3.1',
        'react-dom/client': 'https://esm.sh/react-dom@19.3.1/client',
        // the automatic JSX runtime is a separate module id — list it too
        'react/jsx-runtime': 'https://esm.sh/react@19.3.1/jsx-runtime'
      }
    })
  ]
});
```

**4. externalizeDeps — pure external without shim (dev and build)**

```js
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    pluginExternal({
      externalizeDeps: ['lodash', 'dayjs', /^@babel\//]
    })
  ],
  build: {
    lib: {
      entry: 'src/main.ts',
      formats: ['es'],
      fileName: 'my-lib'
    }
  }
});
```

Pure external leaves a bare specifier, so the consumer has to supply the address itself:
a Node host resolves it from `node_modules`, and a dev-server page needs a
`<script type="importmap">` whose keys match what the browser actually requests — Vite 8 rewrites
an externalized bare specifier to `/@id/<specifier>`, so the keys must carry that prefix
(`{"imports": {"/@id/lodash": "https://esm.sh/lodash@4.18.1"}}`).

**5. `importmap: true` — CDN externals become an import map**

```js
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    pluginExternal({
      externals: {
        lodash: 'https://esm.sh/lodash@4.18.1',
        dayjs: 'https://esm.sh/dayjs@1.11.23'
      },
      importmap: true
    })
  ]
});
```

With the switch on, the CDN-valued entries stay bare specifiers in the bundle instead of absolute
URLs, and the build injects `<script type="importmap">{"imports": …}</script>` (keys are the bare
specifiers) plus one `<link rel="modulepreload" crossorigin>` per URL into the HTML — the addresses
live only in the map, so pointing a dependency at another host is a single edit. This is a
build-only switch: dev still pre-bundles CDN externals through the DepsOptimizer and gets neither a
map nor the preload tags, and stash files are written as usual.

Other shapes — `externals` as an array of strings / RegExps, per-mode `development` /
`production` overrides, `interop: 'auto'`, `nodeBuiltins`, a custom `cacheDir` for the stash
files — are covered in the [usage guide](https://fengxinming.github.io/vite-plugins/plugins/vite-plugin-external/usage).

## Q&A

* Q: Page cannot load after modifying `externals`
* A: Named externals are backed by real stash files cached under `./node_modules/.vite_external` (next to Vite's own `./node_modules/.vite` pre-bundle cache). Delete both with one command to force a rebuild: `rm -rf node_modules/.vite*`

## Contributing

We welcome contributions from the community! If you find a bug or want to suggest an improvement, feel free to open an issue or submit a pull request.

### How to Contribute
1. Fork the repository.
2. Create a new branch for your changes.
3. Submit a pull request with a clear description of your changes.

## License

This project is licensed under the [MIT License](LICENSE).
