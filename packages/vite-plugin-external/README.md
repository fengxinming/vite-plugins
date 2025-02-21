# vite-plugin-external

[![npm package](https://nodei.co/npm/vite-plugin-external.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/vite-plugin-external)

[![NPM version](https://img.shields.io/npm/v/vite-plugin-external.svg?style=flat)](https://npmjs.org/package/vite-plugin-external)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-external.svg?style=flat)](https://npmjs.org/package/vite-plugin-external)

> The `vite-plugin-external` provides a way of excluding dependencies from the runtime code and output bundles. Vite >= 3.1

> When the value of command is `'serve'`, the plugin will add an `alias` configuration with externals that can directly use Vite's file loading capabilities. When the value of command is `'build'`, the plugin will add `rollupOptions` configuration that contains `external` and the `output.globals`. However, setting `interop` to `'auto'` unifies the conversion by turning externals into `alias` configurations, and the resulting built code will utilize compatibility code for getting external dependencies.

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

External dependencies for specific mode. [See more](#override-externals-by-mode)

```ts
import { Plugin as RollupPlugin } from 'rollup';
export interface BasicOptions {
  /**
   * The current working directory in which to join `cacheDir`.
   *
   * 设置当前目录，用于拼接 `cacheDir` 的相对路径。
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
   * 配置外部依赖
   */
  externals?: Record<string, string>;
}

export interface Options extends BasicOptions {
  /**
   * External dependencies for specific mode
   *
   * 针对指定的模式配置外部依赖
   */
  [mode: string]: BasicOptions | any;

  /**
   * Controls how Vite handles default.
   *
   * 该选项用于控制 Vite 如何处理默认值。
   */
  interop?: 'auto';

  /**
   * The value of enforce can be either `"pre"` or `"post"`, see more at https://vitejs.dev/guide/api-plugin.html#plugin-ordering.
   *
   * 强制执行顺序，`pre` 前，`post` 后，参考 https://cn.vitejs.dev/guide/api-plugin.html#plugin-ordering。
   */
  enforce?: 'pre' | 'post';

  /**
   * Whether to exclude nodejs built-in modules in the bundle
   *
   * 是否排除 nodejs 内置模块。
   */
  nodeBuiltins?: boolean;

  /**
   * Specify dependencies to not be included in the bundle
   *
   * 排除不需要打包的依赖。
   */
  externalizeDeps?: Array<string | RegExp>;

  /**
   * Fix https://github.com/rollup/rollup/issues/3188
   */
  externalGlobals?: (globals: Record<string, string>) => RollupPlugin;
}
```

## Usage

### Normal

index.html
```html
<script src="//unpkg.com/react@18.3.1/umd/react.production.min.js"></script>
<script src="//unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js"></script>
```

vite.config.js
```js
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    pluginExternal({
      externals: {
        react: 'React',
        'react-dom/client': 'ReactDOM'
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        format: 'iife'
      }
    }
  }
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
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    pluginExternal({
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

vite.config.mjs
```js
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    pluginExternal({
      interop: 'auto',
      externals: {
        react: 'React',
        'react-dom/client': 'ReactDOM'
      }
    })
  ],
  build: {
    outDir: 'dist/external',
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
import { useState, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
function App() {
  const [count, setCount] = useState(0);
  return (
    <div className="box">
      <h1>Count: {count}</h1>
      <button onClick={() => setCount((prev) => prev + 1)}>Click me</button>
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

#### Output bundle

**Set `interop` to `'auto'`(Vite 6.x)**

```js
(function() {
  "use strict";
  var react;
  var hasRequiredReact;
  function requireReact() {
    if (hasRequiredReact) return react;
    hasRequiredReact = 1;
    react = React;
    return react;
  }
  var reactExports = requireReact();
  var reactDom_client;
  var hasRequiredReactDom_client;
  function requireReactDom_client() {
    if (hasRequiredReactDom_client) return reactDom_client;
    hasRequiredReactDom_client = 1;
    reactDom_client = ReactDOM;
    return reactDom_client;
  }
  var reactDom_clientExports = requireReactDom_client();
  function App() {
    const [count, setCount] = reactExports.useState(0);
    return /* @__PURE__ */ React.createElement("div", { className: "box" }, /* @__PURE__ */ React.createElement("h1", null, "Count: ", count), /* @__PURE__ */ React.createElement("button", { onClick: () => setCount((prev) => prev + 1) }, "Click me"));
  }
  reactDom_clientExports.createRoot(document.getElementById("root")).render(
    /* @__PURE__ */ React.createElement(reactExports.StrictMode, null, /* @__PURE__ */ React.createElement(App, null))
  );
})();
```

**Without `interop` option**

```js
(function(react, client) {
  "use strict";
  function App() {
    const [count, setCount] = react.useState(0);
    return /* @__PURE__ */ React.createElement("div", { className: "box" }, /* @__PURE__ */ React.createElement("h1", null, "Count: ", count), /* @__PURE__ */ React.createElement("button", { onClick: () => setCount((prev) => prev + 1) }, "Click me"));
  }
  client.createRoot(document.getElementById("root")).render(
    /* @__PURE__ */ React.createElement(react.StrictMode, null, /* @__PURE__ */ React.createElement(App, null))
  );
})(React, ReactDOM);
```

### Exclude dependencies

> For example, to exclude dependencies within the `node_modules` directory, you can use the `externalizeDeps` option to exclude them, besides you can use `nodeBuiltins` to exclude Node.js built-in modules.

vite.config.mjs
```js
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';
import { globbySync } from 'globby';
import pkg from './package.json';

export default defineConfig({
  plugins: [
    pluginExternal({
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
import pluginExternal from 'vite-plugin-external';
import externalGlobals from 'rollup-plugin-external-globals';

export default defineConfig({
  plugins: [
    pluginExternal({
      externalGlobals,
      externals: {
        react: 'React',
        'react-dom/client': 'ReactDOM'
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        format: 'iife'
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
  * New configuration option `externalGlobals` to fix https://github.com/rollup/rollup/issues/3188

* 4.3.1
  * The `externalizeDeps` configuration option now supports passing in regular expressions.

* 4.3.0
  * Use `interop: 'auto'` instead of `mode: false`.
  * New configuration options `nodeBuiltins` and `externalizeDeps` have been introduced for handling the bundling process after developing Node.js modules.
