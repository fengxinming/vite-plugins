# vite-plugin-external

[![npm package](https://nodei.co/npm/vite-plugin-external.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/vite-plugin-external)

[![NPM version](https://img.shields.io/npm/v/vite-plugin-external.svg?style=flat)](https://npmjs.org/package/vite-plugin-external)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-external.svg?style=flat)](https://npmjs.org/package/vite-plugin-external)

> The `vite-plugin-external` provides a way of excluding dependencies from the runtime code and output bundles. Vite >= 3.1

> When the value of command is `'serve'`, the plugin will add an `alias` configuration with externals that can directly use Vite's file loading capabilities. When the value of command is `'build'`, the plugin will add `rollupOptions` configuration that contains `external` and the `output.globals`. However, setting `interop` to `'auto'` unifies the conversion by turning externals into `alias` configurations, and the resulting built code will utilize compatibility code for getting external dependencies.

![image](https://user-images.githubusercontent.com/6262382/126889725-a5d276ad-913a-4498-8da1-2aa3fd1404ab.png)

## English | [中文](README_zh-CN.md)

## Table of contents

* [Installation](#installation)
* [Options](#options)
* [Usage](#usage)
* [Examples](#examples)
* [Changelog](#changelog)

## Installation

```bash
npm install vite-plugin-external --save-dev
```

## Options

**`mode`**
* Type: `string`
* Required: false

External dependencies for specific modes. [See more](#override-externals-by-mode)

**`interop`**
* Type: `'auto'`
* Required: false

Controls how Rollup handles default. [See more](#interop-option)

**`enforce`**
* Type: `'pre' | 'post'`
* Required: false

The value of enforce can be either `"pre"` or `"post"`, see more at https://vitejs.dev/guide/api-plugin.html#plugin-ordering.

**`nodeBuiltins`**
* Type: `boolean`
* Required: false

Whether to exclude nodejs built-in modules in the bundle. [See more](#exclude-dependencies)

**`externalizeDeps`**
* Type: `Array<string | RegExp>`
* Required: false

Specify dependencies to not be included in the bundle. [See more](#exclude-dependencies)

**`externalGlobals`**
* Type: `(globals: Record<string, any>) => rollup.Plugin`
* Required: false

Fix https://github.com/rollup/rollup/issues/3188

**`cwd`**
* Type: `string`
* Required: false
* Default: `process.cwd()`

The current working directory in which to join `cacheDir`.

**`cacheDir`**
* Type: `string`
* Required: false
* Default: `node_modules/.vite_external`

Cache folder.

**`externals`**
* Type: `Record<string, any>`
* Required: false

External dependencies. [See more](#normal)

**`[mode: string]`**
* Type: `BasicOptions`
* Required: false

External dependencies for specific mode.

```ts
import { Plugin } from 'rollup';

export interface BasicOptions {
  /**
   * The current working directory in which to join `cacheDir`.
   *
   * 用于拼接 `cacheDir` 的路径。
   *
   * @default `process.cwd()`
   */
  cwd?: string;

  /**
   * Cache folder
   *
   * 缓存文件夹
   *
   * @default `${cwd}/node_modules/.vite_external`
   */
  cacheDir?: string;

  /**
   * External dependencies
   *
   * 外部依赖
   */
  externals?: Record<string, any>;
}

export interface Options extends BasicOptions {
  /**
   * External dependencies for specific mode
   *
   * 针对指定的模式配置外部依赖。
   */
  [mode: string]: BasicOptions | any;

  /**
   * Different `externals` can be specified in different modes.
   *
   * 在不同的模式下，可以指定不同的外部依赖。
   */
  mode?: string;

  /**
   * Controls how Rollup handles default.
   *
   * 用于控制读取外部依赖的默认值
   */
  interop?: 'auto';

  /**
   * The value of enforce can be either `"pre"` or `"post"`, see more at https://vitejs.dev/guide/api-plugin.html#plugin-ordering.
   *
   * 强制执行顺序，`pre` 前，`post` 后，参考 https://cn.vitejs.dev/guide/api-plugin.html#plugin-ordering
   */
  enforce?: 'pre' | 'post';

  /**
   * Whether to exclude nodejs built-in modules in the bundle
   *
   * 是否排除 nodejs 内置模块
   */
  nodeBuiltins?: boolean;

  /**
   * Specify dependencies to not be included in the bundle
   *
   * 排除不需要打包的依赖
   */
  externalizeDeps?: Array<string | RegExp>;

  /**
   * Fix https://github.com/rollup/rollup/issues/3188
   */
  externalGlobals?: (globals: Record<string, any>) => Plugin;
}
```

## Usage

### Normal

index.html
```html
<script src="//cdn.jsdelivr.net/npm/react@16.14.0/umd/react.production.min.js"></script>
```

vite.config.js
```js
import { defineConfig } from 'vite';
import createExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    createExternal({
      externals: {
        react: 'React'
      }
    })
  ]
});
```

### Override externals by mode

> Sometimes the CDN used in the development environment may not be the same as the one used in the production environment. 

index.html
```html
<script src="//g.alicdn.com/linkdesign/lib/1.0.1/~react.js"></script>
```

vite.config.js
```js
import { defineConfig } from 'vite';
import createExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    createExternal({
      externals: {
        react: '$linkdesign.React'
      },
      development: {
        externals: {
          react: 'React'
        }
      }
    })
  ]
});
```

### Interop option

> Set `interop` to `'auto'` to use aliases and caching mechanisms consistently.

index.html
```html
<script src="//g.alicdn.com/linkdesign/lib/1.0.1/~react.js"></script>
```

vite.config.mjs
```js
import { defineConfig } from 'vite';
import createExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    createExternal({
      interop: 'auto',
      externals: {
        react: '$linkdesign.React',
        'react-dom': '$linkdesign.ReactDOM',
        'prop-types': '$linkdesign.PropTypes'
      }
    })
  ],
  build: {
    minify: false,
    rollupOptions: {
      output: {
        format: 'iife'
      }
    }
  }
});
```

#### Source code

```js
import { createElement, Fragment, useState } from 'react';
import ReactDOM from 'react-dom';
function App() {
  const [count, setCount] = useState(0);
  return createElement(Fragment, null,
    createElement('h1', null, `Count: ${count}`),
    createElement('button', {
      onClick: () => setCount((prev) => prev + 1)
    }, 'Click me')
  );
}
ReactDOM.render(
  createElement(App),
  document.getElementById('root')
);
```

#### Output bundle

Set `interop` to `'auto'`

```js
(function() {
  "use strict";
  function getDefaultExportFromCjs(x) {
    return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
  }
  var react = $linkdesign.React;
  var reactDom = $linkdesign.ReactDOM;
  const ReactDOM = /* @__PURE__ */ getDefaultExportFromCjs(reactDom);
  function App() {
    const [count, setCount] = react.useState(0);
    return react.createElement(
      react.Fragment,
      null,
      react.createElement("h1", null, `Count: ${count}`),
      react.createElement("button", {
        onClick: () => setCount((prev) => prev + 1)
      }, "Click me")
    );
  }
  ReactDOM.render(
    react.createElement(App),
    document.getElementById("root")
  );
})();
```

Without `interop` option

```js
(function(react, ReactDOM) {
  "use strict";
  function App() {
    const [count, setCount] = react.useState(0);
    return react.createElement(
      react.Fragment,
      null,
      react.createElement("h1", null, `Count: ${count}`),
      react.createElement("button", {
        onClick: () => setCount((prev) => prev + 1)
      }, "Click me")
    );
  }
  ReactDOM.render(
    react.createElement(App),
    document.getElementById("root")
  );
})($linkdesign.React, $linkdesign.ReactDOM);
```

### Exclude dependencies

> For example, to exclude dependencies within the `node_modules` directory, you can use the `externalizeDeps` option to exclude them, besides you can use `nodeBuiltins` to exclude Node.js built-in modules.

vite.config.mjs
```js
import { defineConfig } from 'vite';
import vitePluginExternal from 'vite-plugin-external';
import { globbySync } from 'globby';
import pkg from './package.json';

export default defineConfig({
  plugins: [
    vitePluginExternal({
      nodeBuiltins: true,
      externalizeDeps: Object.keys(pkg.dependencies)
    })
  ],
  build: {
    minify: false,
    lib: {
      formats: ['es', 'cjs'],
      entry: globbySync('src/*.js'),
      fileName(format, entryName) {
        return entryName + (format === 'es' ? '.mjs' : '.js');
      }
    }
  }
});
```

### fix rollup#3188

> See more https://github.com/rollup/rollup/issues/3188

vite.config.mjs
```js
import { defineConfig } from 'vite';
import vitePluginExternal from 'vite-plugin-external';
import externalGlobals from 'rollup-plugin-external-globals';
import { globbySync } from 'globby';

export default defineConfig({
  plugins: [
    vitePluginExternal({
      nodeBuiltins: true,
      externalGlobals
    })
  ],
  build: {
    outDir: 'dist/external',
    minify: false,
    lib: {
      formats: ['es', 'cjs'],
      entry: globbySync('src/*.js'),
      fileName(format, entryName) {
        return entryName + (format === 'es' ? '.mjs' : '.js');
      }
    }
  }
});
```

## Examples

* [See vite3 demo](../../examples/vite3-demo)
* [See vite4 demo](../../examples/vite4-demo)
* [See vite5 demo](../../examples/vite5-demo)
* [See vite6 demo](../../examples/vite6-demo)

## Changelog

* 6.0.0
  * `externalGlobals` fix https://github.com/rollup/rollup/issues/3188

* 4.3.1
  * The `externalizeDeps` configuration option now supports passing in regular expressions.

* 4.3.0
  * Use `interop: 'auto'` instead of `mode: false`.
  * New configuration options `nodeBuiltins` and `externalizeDeps` have been introduced for handling the bundling process after developing Node.js modules.
