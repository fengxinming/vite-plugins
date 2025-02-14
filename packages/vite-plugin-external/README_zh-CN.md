# vite-plugin-external

[![npm package](https://nodei.co/npm/vite-plugin-external.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/vite-plugin-external)

[![NPM version](https://img.shields.io/npm/v/vite-plugin-external.svg?style=flat)](https://npmjs.org/package/vite-plugin-external)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-external.svg?style=flat)](https://npmjs.org/package/vite-plugin-external)

> 使用范围 Vite >= 3.1

> 当 `command` 的值为 `'serve'` 时，插件将 `externals` 转换成 `alias` 配置，这样可以直接使用 Vite 的文件加载能力；当 `command` 的值为 `'build'` 时，插件将 `externals` 转换成 `rollupOptions` 配置,包含 `external` 和 `output.globals`。但是可以通过配置 `interop` 为 `'auto'`，统一将 `externals` 转换成 `alias` 配置，打包后的代码中会使用兼容代码导入外部依赖。

![image](https://user-images.githubusercontent.com/6262382/126889725-a5d276ad-913a-4498-8da1-2aa3fd1404ab.png)

## [English](README.md) | 中文

## 目录

* [安装](#安装)
* [参数介绍](#参数介绍)
* [使用](#使用)
* [示例](#示例)
* [变更记录](#变更记录)

## 安装

```bash
npm install vite-plugin-external --save-dev
```

## 参数介绍

**`mode`**
* Type: `string`
* Required: false

在不同的模式下，可以指定不同的外部依赖。[示例](#在不同的模式下覆盖externals)

**`interop`**
* Type: `'auto'`
* Required: false

用于控制读取外部依赖的默认值。[示例](#使用兼容的方式读取外部依赖)

**`enforce`**
* Type: `'pre' | 'post'`
* Required: false

强制执行顺序，`pre` 前，`post` 后，参考 https://cn.vitejs.dev/guide/api-plugin.html#plugin-ordering。

**`nodeBuiltins`**
* Type: `boolean`
* Required: false

是否排除 nodejs 内置模块。

**`externalizeDeps`**
* Type: `Array<string | RegExp>`
* Required: false

排除不需要打包的依赖。[示例](#排除不需要打包的依赖)

**`externalGlobals`**
* Type: `(globals: Record<string, any>) => rollup.Plugin`
* Required: false

修复 https://github.com/rollup/rollup/issues/3188

**`cwd`**
* Type: `string`
* Required: false
* Default: `process.cwd()`

设置当前目录，用于拼接 `cacheDir` 的相对路径。

**`cacheDir`**
* Type: `string`
* Required: false
* Default: `node_modules/.vite_external`

缓存文件夹。

**`externals`**
* Type: `Record<string, any>`
* Require: false

配置外部依赖。[示例](#常规使用)

**`[mode: string]`**
* Type: `BasicOptions`
* Require: false

针对指定的模式配置外部依赖。

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

## 使用

### 常规使用

index.html
```html
<script src="//cdn.jsdelivr.net/npm/react@16.14.0/umd/react.production.min.js"></script>
```

vite.config.mjs
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

### 在不同的模式下覆盖externals

> 有时候可能开发环境和生产环境用到的 cdn 不一致。针对这种情况，可以配置 `development` 和 `production` 两个模式，分别对应开发环境和生产环境的外部依赖。

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

### 使用兼容的方式读取外部依赖

> 设置 `interop` 为 `'auto'` 即统一使用别名和缓存机制。

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
  ]
});
```

#### 对比输出内容

> `interop` 为 `'auto'` 时

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

> 未配置 `interop`

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

### 排除不需要打包的依赖

> 比如要排除 `node_modules` 内的依赖，可以使用 `externalizeDeps` 排除它们。或者使用 `nodeBuiltins` 排除 Nodejs 内置模块。

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

### 解决 IIFE 格式的打包问题

> 引入插件 `rollup-plugin-external-globals`，具体问题参阅 https://github.com/rollup/rollup/issues/3188

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

## 示例

* [See vite3 demo](../../examples/vite3-demo)
* [See vite4 demo](../../examples/vite4-demo)
* [See vite5 demo](../../examples/vite5-demo)
* [See vite6 demo](../../examples/vite6-demo)

## 变更记录

* 6.0.0
  * `externalGlobals` fix https://github.com/rollup/rollup/issues/3188

* 4.3.1
  * `externalizeDeps` 配置项支持传入正则表达式

* 4.3.0
  * 上一个版本的 `mode: false` 的逻辑改用 `interop: 'auto'` 代替
  * 新增字段 `nodeBuiltins` 和 `externalizeDeps` 配置项用于开发node模块后的打包处理
