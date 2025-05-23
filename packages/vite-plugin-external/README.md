# vite-plugin-external

[![npm package](https://nodei.co/npm/vite-plugin-external.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/vite-plugin-external)

[![NPM version](https://img.shields.io/npm/v/vite-plugin-external.svg?style=flat)](https://npmjs.org/package/vite-plugin-external)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-external.svg?style=flat)](https://npmjs.org/package/vite-plugin-external)
[![Node version](https://img.shields.io/node/v/vite-plugin-external.svg?style=flat)](https://npmjs.org/package/vite-plugin-external)

> Excludes specified module dependencies from runtime code and built bundles.
> Vite >= 3.1


## Documentation

For detailed usage instructions and API references, please visit the official documentation:

👉 [View Full Documentation](https://fengxinming.github.io/vite-plugins/plugins/vite-plugin-external/quick-start)

## Quick Start

**Build iife format bundle**

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
        'react-dom/client': 'ReactDOM'
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        format: 'iife',
      },
    },
  }
});
```

**Dynamic set externals**
```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'classic',
    }),
    pluginExternal({
      externals(libName) {
        if (libName === 'react') {
          return 'React';
        }
        if (libName === 'react-dom/client') {
          return 'ReactDOM';
        }
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        format: 'iife',
      },
    },
  }
});
```

**Build esm format bundle**
```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'classic',
    }),
    pluginExternal({
      externals: {
        react: 'https://esm.sh/react@18.3.1',
        'react-dom/client': 'https://esm.sh/react-dom@18.3.1'
      }
    })
  ]
});
```

## Changelog

* **6.2.0**
  * Support links to external resources

* **6.1.0**
  * Reimplemented external plugin logic for Vite 6.x compatibility
  * Added optional `rollback` parameter to revert to previous implementation
  * Added optional `logLevel` parameter to control logging level (values: "TRACE" | "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL" | "OFF")
  * Support to set `externals` as a function

* **6.0.0**
  * Added optional `externalGlobals` parameter to fix issue [rollup#3188](https://github.com/rollup/rollup/issues/3188)

* **4.3.1**
  * `externalizeDeps` configuration supports regex patterns

* **4.3.0**
  * Previous `mode: false` logic replaced with `interop: 'auto'`
  * Added `nodeBuiltins` and `externalizeDeps` configurations for Node module bundling

## Q&A

* Q: Page cannot load after modifying `externals`
* A: The previous dependencies are cached by Vite, you need to manually delete the `./node_modules/.vite/deps` folder

## Contributing

We welcome contributions from the community! If you find a bug or want to suggest an improvement, feel free to open an issue or submit a pull request.

### How to Contribute
1. Fork the repository.
2. Create a new branch for your changes.
3. Submit a pull request with a clear description of your changes.

## License

This project is licensed under the [MIT License](LICENSE).