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

Each example below mirrors a real, build-tested config under `examples/vite8-external` (`vite.config.1.mts` … `vite.config.12.mts`).

### Prerequisite: provide the globals in `index.html`

Global-name externals (e.g. `react: 'React'`) only take effect if the global variable actually exists at runtime — the plugin rewrites the import to a global lookup, it does **not** download anything. So load the UMD builds in `index.html` **before** writing the config, and keep the `window` names aligned with the values in `externals`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>demo</title>
  <!-- CDN UMD builds provide window.React / window.ReactDOM -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/index.tsx"></script>
</body>
</html>
```

Same rule for per-mode overrides (example 6/12): every mode's global names must exist on `window` in that environment. The ESM CDN shape (example 3) is the exception — nothing to add manually: the bundle imports the absolute CDN URLs directly and the plugin injects `<link rel="modulepreload">` for first-paint prefetching.

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

`(source, importer, isResolved)` — return a string (global name / CDN URL), `true` (pure external), or a falsy value to let it resolve normally. IIFE lib builds need `build.lib.name`:

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
        react: 'https://esm.sh/react@18.3.1',
        'react-dom/client': 'https://esm.sh/react-dom@18.3.1'
      }
    })
  ]
});
```

**4. Array of strings and regex (pure external on match)**

```js
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    pluginExternal({
      externals: ['lodash', /^@babel\//],
      nodeBuiltins: true
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

**5. externalizeDeps — pure external without shim (build only)**

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

**6. Per-mode override (development / production)**

```js
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    pluginExternal({
      externals: {
        react: 'React',
        'react-dom': 'ReactDOM'
      },
      production: {
        externals: {
          react: '$linkdesign.React',
          'react-dom': '$linkdesign.ReactDOM'
        }
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

**7. interop: 'auto' — fix IIFE require wrapping**

Clears `build.rolldownOptions.external` during build so every named external resolves through the stash-file CJS shim (`module.exports = React;`) — a shape Rolldown's IIFE wrapper always handles correctly:

```js
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    pluginExternal({
      interop: 'auto',
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

**8. nodeBuiltins + externalizeDeps — Node.js library build**

```js
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    pluginExternal({
      nodeBuiltins: true,
      externalizeDeps: ['lodash', 'dayjs']
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

**9. Vue externalization (IIFE lib build)**

```js
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    pluginExternal({
      externals: {
        vue: 'Vue'
      }
    })
  ],
  build: {
    lib: {
      entry: 'src/vue-app.ts',
      formats: ['iife'],
      name: 'MyVueApp',
      fileName: 'main'
    }
  }
});
```

**10. Custom cacheDir for stash files**

```js
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    pluginExternal({
      cacheDir: '.external-cache',
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

**11. Per-mode override of externalizeDeps / nodeBuiltins (>= 8.0.3)**

Mode blocks may override any `BasicOptions` field; `externalizeDeps` arrays are merged (concat + dedupe):

```js
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    pluginExternal({
      externalizeDeps: ['lodash'],
      production: {
        externalizeDeps: ['dayjs'],
        nodeBuiltins: true
      }
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
