# vite-plugin-external

[![npm package](https://nodei.co/npm/vite-plugin-external.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/vite-plugin-external)

[![NPM version](https://img.shields.io/npm/v/vite-plugin-external.svg?style=flat)](https://npmjs.org/package/vite-plugin-external)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-external.svg?style=flat)](https://npmjs.org/package/vite-plugin-external)

> The `vite-plugin-external` provides a way of excluding dependencies from the runtime code and output bundles. Vite >= 3.1

> 插件的初衷是为了解决，在开发时依赖的第三方库为cdn资源，非本地依赖包。添加 `rollupOptions` 并配置 `external` 和 `output.globals` 只能在构建时生效，为了充分利用 Vite 的构建能力，插件采用了别名加缓存的方式，不需要依赖其它包再次处理每个文件。

开发环境下的处理流程
![image](https://user-images.githubusercontent.com/6262382/126889725-a5d276ad-913a-4498-8da1-2aa3fd1404ab.png)

## Installation

```bash
npm install vite-plugin-external --save-dev
```

## Options

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
   * External dependencies for specific modes
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

Option | Type | Default | Description
------ | ---- | ------- | -----------
`enforce?` | `string` | Optional: `'pre' \| 'post'` | The value of enforce can be either `"pre"` or `"post"`, see more at https://vitejs.dev/guide/api-plugin.html#plugin-ordering.<br/><br/> 强制执行顺序，`pre` 前，`post` 后，参考 https://cn.vitejs.dev/guide/api-plugin.html#plugin-ordering
`cwd?` | `string` | `process.cwd()` | The current working directory in which to join `cacheDir`.<br/><br/> 用于拼接 `cacheDir` 的路径.
`cacheDir?` | `string` | `${cwd}/node_modules/.vite_external` | Cache folder<br/><br/> 缓存文件夹
`mode?` | `string` | `'development'` | The mode to use when resolving `externals`.<br/><br/> 当配置的 `mode` 和执行 `vite` 命令时传入的 `--mode` 参数匹配时，将采用了别名加缓存的方式处理 `externals`。
`format?` | `string` | `'cjs'` | External dependencies format.<br/><br/> 外部依赖以什么格式封装
`externals` | `Record<string, any>` | - | External dependencies.<br/><br/> 外部依赖
`[mode: string]` | `BasicOptions` | - | External dependencies for specific modes.<br/><br/> 针对指定的模式配置外部依赖

## Usage

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

> Sometimes the CDN used in the development environment may not be the same as the one used in the production environment. To address this situation, you can configure two modes, development and production, which correspond to external dependencies in the development environment and production environment, respectively.

> 有时候可能开发环境和生产环境用到的 cdn 不一致。针对这种情况，可以配置 `development` 和 `production` 两个模式，分别对应开发环境和生产环境的外部依赖。

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
        externals: {
          react: '$linkdesign.React'
        }
      },
      development: {
        react: 'React'
      }
    })
  ]
});
```

### mode option

> Set `mode` to `false` to use aliases and caching mechanisms consistently.

> 设置 `mode` 为 `false` 即统一使用别名和缓存机制。

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
      mode: false,
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

Set `mode` to `false`
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

`mode` is not `false`
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

## Examples

* [See vite3 demo](../../examples/vite3-external)
* [See vite4 demo](../../examples/vite4-external)
* [See vite5 demo](../../examples/vite5-external)
