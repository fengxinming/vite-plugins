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

* `mode` - `string` Optional, External dependencies for specific modes. [Example](#override-externals-by-mode)
* `interop` - `'auto'` Optional, Controls how Rollup handles default. [Example](#interop-option)
* `enforce` - `'pre' | 'post'` Optional, The value of enforce can be either `"pre"` or `"post"`, see more at https://vitejs.dev/guide/api-plugin.html#plugin-ordering.
* `nodeBuiltins?` - `boolean` Optional, Whether to exclude nodejs built-in modules in the bundle. [Example](#exclude-dependencies)
* `externalizeDeps?` - `string[]` Optional, Specify dependencies to not be included in the bundle. [Example](#exclude-dependencies)
* `cwd` - `string` Optional, Default: `process.cwd()`, The current working directory in which to join `cacheDir`.
* `cacheDir` - `string` Optional, Default: `${cwd}/node_modules/.vite_external`, Cache folder.
* `externals` - `Record<string, any>` Optional, External dependencies. [Example](#normal)
* `[mode: string]` - `BasicOptions` Optional, External dependencies for specific mode.

```ts
export interface BasicOptions {
  /**
   * The current working directory in which to search.
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
  externals: Record<string, any>;
}

export interface Options extends BasicOptions {
  /**
   * External dependencies for specific mode
   *
   * 针对指定的模式配置外部依赖
   */
  [mode: string]: BasicOptions | any;

  /**
   * The mode to use when resolving `externals`.
   *
   * 当配置的 `mode` 和执行 `vite` 命令时传入的 `--mode` 参数匹配时，将采用了别名加缓存的方式处理 `externals`。
   * 设置为 `false` 时，可以有效解决外部依赖对象在 `default` 属性。
   *
   * @default 'development'
   */
  mode?: string | false;

  /**
   * The value of enforce can be either `"pre"` or `"post"`, see more at https://vitejs.dev/guide/api-plugin.html#plugin-ordering.
   *
   * 强制执行顺序，`pre` 前，`post` 后，参考 https://cn.vitejs.dev/guide/api-plugin.html#plugin-ordering
   */
  enforce?: 'pre' | 'post';

  /**
   * External dependencies format
   *
   * 外部依赖以什么格式封装
   *
   * @default 'cjs'
   */
  format?: 'cjs' | 'es';
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

vite.config.js
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
  ]
});
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
  const React = /* @__PURE__ */ getDefaultExportFromCjs(react);
  var reactDom = $linkdesign.ReactDOM;
  const ReactDOM = /* @__PURE__ */ getDefaultExportFromCjs(reactDom);
  function App() {
    const [count, setCount] = react.useState(0);
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("h1", null, "Count: ", count), /* @__PURE__ */ React.createElement("button", { onClick: () => setCount((prev) => prev + 1) }, "Click me"));
  }
  ReactDOM.render(
    /* @__PURE__ */ React.createElement(App, null),
    document.getElementById("root")
  );
})();
```

Without `interop` option

```js
(function(React, ReactDOM) {
  "use strict";
  function App() {
    const [count, setCount] = React.useState(0);
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("h1", null, "Count: ", count), /* @__PURE__ */ React.createElement("button", { onClick: () => setCount((prev) => prev + 1) }, "Click me"));
  }
  ReactDOM.render(
    /* @__PURE__ */ React.createElement(App, null),
    document.getElementById("root")
  );
})($linkdesign.React, $linkdesign.ReactDOM);
```

### Exclude dependencies

> For example, to exclude dependencies within the node_modules directory, you can use the externalizeDeps option to exclude them. Alternatively, utilize nodeBuiltins to exclude Node.js built-in modules.

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

## Examples

* [See vite3 demo](../../examples/vite3-external)
* [See vite4 demo](../../examples/vite4-external)
* [See vite5 demo](../../examples/vite5-external)

## Changelog

* Use `interop: 'auto'` instead of `mode: false`.
* New configuration options `nodeBuiltins` and `externalizeDeps` have been introduced for handling the bundling process after developing Node.js modules.