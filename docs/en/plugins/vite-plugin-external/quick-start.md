# vite-plugin-external

[![npm package](https://nodei.co/npm/vite-plugin-external.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/vite-plugin-external)

> Exclude specified module dependencies from runtime code and built bundles.
> Supported Vite versions: >= 3.1.

[![NPM version](https://img.shields.io/npm/v/vite-plugin-external.svg?style=flat)](https://npmjs.org/package/vite-plugin-external)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-external.svg?style=flat)](https://npmjs.org/package/vite-plugin-external)
[![Node version](https://img.shields.io/node/v/vite-plugin-external.svg?style=flat)](https://npmjs.org/package/vite-plugin-external)

## Description

### Workflow for Vite 6.x and Earlier

When the `command` value is `'serve'`, the plugin converts `externals` into `alias` configuration to leverage Vite's file loading capabilities. When `command` is `'build'`, it converts `externals` into `rollupOptions` configuration containing `external` and `output.globals`. However, you can configure `interop` as `'auto'` to uniformly convert `externals` into `alias` configuration, resulting in compatible import code in the bundled output.

#### Runtime Flow

![image](https://user-images.githubusercontent.com/6262382/126889725-a5d276ad-913a-4498-8da1-2aa3fd1404ab.png)

### Workflow for Vite 6.x and Later

When `command` is `'serve'`, the plugin prebuilds `externals` and reads Vite cache upon request hits. It supports `externals` as `object` or `function` from v6.1.

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

## Q&A

* Q: Page cannot load after modifying `externals`
* A: The previous dependencies are cached by Vite, you need to manually delete the `./node_modules/.vite/deps` folder

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
