# vite-plugin-external

[![npm package](https://nodei.co/npm/vite-plugin-external.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/vite-plugin-external)

[![NPM version](https://img.shields.io/npm/v/vite-plugin-external.svg?style=flat)](https://npmjs.org/package/vite-plugin-external)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-external.svg?style=flat)](https://npmjs.org/package/vite-plugin-external)

> Exclude specified module dependencies from runtime code and built bundles.
> Supports Vite >= 3.1.

## Description

When the `command` value is `'serve'`, the plugin converts `externals` into `alias` configuration to leverage Vite's file loading capabilities. When the `command` value is `'build'`, it converts `externals` into `rollupOptions` configuration, including `external` and `output.globals`. However, you can set `interop` to `'auto'` to uniformly convert `externals` into `alias` configuration. The bundled code will use compatible import syntax for external dependencies.

## Runtime Flow

![image](https://user-images.githubusercontent.com/6262382/126889725-a5d276ad-913a-4498-8da1-2aa3fd1404ab.png)

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

        vue: 'Vue'
      }
    })
  ]
});
```

## Changelog

* **6.0.0**
  * Added `externalGlobals` field to fix [Rollup issue #3188](https://github.com/rollup/rollup/issues/3188)

* **4.3.1**
  * `externalizeDeps` configuration supports passing regular expressions

* **4.3.0**
  * Previous `mode: false` logic replaced with `interop: 'auto'`
  * Added `nodeBuiltins` and `externalizeDeps` configuration for Node module bundling
