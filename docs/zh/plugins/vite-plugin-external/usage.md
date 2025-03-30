# 使用示例

## 基础使用

vite.config.mjs
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

## 动态配置全局变量名

```js
import { defineConfig } from 'vite';
import vitePluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    vitePluginExternal({
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
        format: 'iife'
      }
    }
  }
});
```

## 多模式场景配置

> 有时候可能开发环境和生产环境用到的 cdn 不一致。针对这种情况，可以配置 `development` 和 `production` 两个模式，分别对应开发环境和生产环境的外部依赖。

production `index.html`
```html
<script src="//unpkg.com/react@18.3.1/umd/react.development.js"></script>
<script src="//unpkg.com/react-dom@18.3.1/umd/react.development.js"></script>
```

development `index.html`
```html
<script src="//g.alicdn.com/linkdesign/lib/1.0.1/~react.js"></script>
```

vite.config.mjs
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

## 调整打包策略

> 插件在处理外部依赖时有两套策略，分别应用到开发运行时和构建时。

> 开发运行时，插件会根据 `externals` 配置项，将外部依赖映射成 `module.exports = ${globalName};`。

> 构建时，插件会根据 `externals` 配置项，将外部依赖映射成 `rollupOptions.external` 和 `rollupOptions.output`。

> `interop` 配置项，用于控制是否沿用第一种策略。

**以下面这段配置为例：**

`vite.config.mjs`

```js
import { defineConfig } from 'vite';
import vitePluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    vitePluginExternal({
      logLevel: 'TRACE',
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

`index.html`

```html
<script src="//g.alicdn.com/linkdesign/lib/1.0.1/??babel-polyfill.js,~react.js"></script>
```

`src/index.jsx`

**打包前**

```jsx
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

### 设置 `interop` 为 `'auto'`

**打包后**

::: code-group

```js [Vite 6.x]
(function() {
  "use strict";
  function getDefaultExportFromCjs(x) {
    return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
  }
  var react;
  var hasRequiredReact;
  function requireReact() {
    if (hasRequiredReact) return react;
    hasRequiredReact = 1;
    react = $linkdesign.React;
    return react;
  }
  var reactExports = requireReact();
  const React = /* @__PURE__ */ getDefaultExportFromCjs(reactExports);
  var reactDom;
  var hasRequiredReactDom;
  function requireReactDom() {
    if (hasRequiredReactDom) return reactDom;
    hasRequiredReactDom = 1;
    reactDom = $linkdesign.ReactDOM;
    return reactDom;
  }
  var reactDomExports = requireReactDom();
  const ReactDOM = /* @__PURE__ */ getDefaultExportFromCjs(reactDomExports);
  function App() {
    const [count, setCount] = reactExports.useState(0);
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("p", null, reactExports.version), /* @__PURE__ */ React.createElement("h1", null, "Count: ", count), /* @__PURE__ */ React.createElement("button", { onClick: () => setCount((prev) => prev + 1) }, "Click me"));
  }
  ReactDOM.render(
    /* @__PURE__ */ React.createElement(App, null),
    document.getElementById("root")
  );
})();
```

```js [Vite 5.x]
(function() {
  "use strict";
  function getDefaultExportFromCjs(x) {
    return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
  }
  var react = React;
  const React$1 = /* @__PURE__ */ getDefaultExportFromCjs(react);
  var reactDom = $linkdesign.ReactDOM;
  const ReactDOM = /* @__PURE__ */ getDefaultExportFromCjs(reactDom);
  function App() {
    const [count, setCount] = react.useState(0);
    return /* @__PURE__ */ React$1.createElement(React$1.Fragment, null, /* @__PURE__ */ React$1.createElement("p", null, react.version), /* @__PURE__ */ React$1.createElement("h1", null, "Count: ", count), /* @__PURE__ */ React$1.createElement("button", { onClick: () => setCount((prev) => prev + 1) }, "Click me"));
  }
  ReactDOM.render(
    /* @__PURE__ */ React$1.createElement(App, null),
    document.getElementById("root")
  );
})();
```

```js [Vite 4.x]
(function() {
  "use strict";
  function getDefaultExportFromCjs(x) {
    return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
  }
  var react = React;
  const React$1 = /* @__PURE__ */ getDefaultExportFromCjs(react);
  var reactDom = $linkdesign.ReactDOM;
  const ReactDOM = /* @__PURE__ */ getDefaultExportFromCjs(reactDom);
  function App() {
    const [count, setCount] = react.useState(0);
    return /* @__PURE__ */ React$1.createElement(React$1.Fragment, null, /* @__PURE__ */ React$1.createElement("p", null, react.version), /* @__PURE__ */ React$1.createElement("h1", null, "Count: ", count), /* @__PURE__ */ React$1.createElement("button", { onClick: () => setCount((prev) => prev + 1) }, "Click me"));
  }
  ReactDOM.render(
    /* @__PURE__ */ React$1.createElement(App, null),
    document.getElementById("root")
  );
})();
```

```js [Vite 3.x]
(function() {
  "use strict";
  var react = React;
  var reactDom = $linkdesign.ReactDOM;
  function App() {
    const [count, setCount] = react.useState(0);
    return /* @__PURE__ */ react.createElement(react.Fragment, null, /* @__PURE__ */ react.createElement("p", null, react.version), /* @__PURE__ */ react.createElement("h1", null, "Count: ", count), /* @__PURE__ */ react.createElement("button", { onClick: () => setCount((prev) => prev + 1) }, "Click me"));
  }
  reactDom.render(
    /* @__PURE__ */ react.createElement(App, null),
    document.getElementById("root")
  );
})();
```

:::


### 未设置 `interop`

**打包后**

::: code-group
```js [Vite 6.x]
(function(React, ReactDOM) {
  "use strict";
  function App() {
    const [count, setCount] = React.useState(0);
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("p", null, React.version), /* @__PURE__ */ React.createElement("h1", null, "Count: ", count), /* @__PURE__ */ React.createElement("button", { onClick: () => setCount((prev) => prev + 1) }, "Click me"));
  }
  ReactDOM.render(
    /* @__PURE__ */ React.createElement(App, null),
    document.getElementById("root")
  );
})($linkdesign.React, $linkdesign.ReactDOM);
```

```js [Vite 5.x]
(function(React, ReactDOM) {
  "use strict";
  function App() {
    const [count, setCount] = React.useState(0);
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("p", null, React.version), /* @__PURE__ */ React.createElement("h1", null, "Count: ", count), /* @__PURE__ */ React.createElement("button", { onClick: () => setCount((prev) => prev + 1) }, "Click me"));
  }
  ReactDOM.render(
    /* @__PURE__ */ React.createElement(App, null),
    document.getElementById("root")
  );
})($linkdesign.React, $linkdesign.ReactDOM);
```

```js [Vite 4.x]
(function(React, ReactDOM) {
  "use strict";
  function App() {
    const [count, setCount] = React.useState(0);
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("p", null, React.version), /* @__PURE__ */ React.createElement("h1", null, "Count: ", count), /* @__PURE__ */ React.createElement("button", { onClick: () => setCount((prev) => prev + 1) }, "Click me"));
  }
  ReactDOM.render(
    /* @__PURE__ */ React.createElement(App, null),
    document.getElementById("root")
  );
})($linkdesign.React, $linkdesign.ReactDOM);
```

```js [Vite 3.x]
(function(React, ReactDOM) {
  "use strict";
  const _interopDefaultLegacy = (e) => e && typeof e === "object" && "default" in e ? e : { default: e };
  const React__default = /* @__PURE__ */ _interopDefaultLegacy(React);
  const ReactDOM__default = /* @__PURE__ */ _interopDefaultLegacy(ReactDOM);
  function App() {
    const [count, setCount] = React.useState(0);
    return /* @__PURE__ */ React__default.default.createElement(React__default.default.Fragment, null, /* @__PURE__ */ React__default.default.createElement("p", null, React.version), /* @__PURE__ */ React__default.default.createElement("h1", null, "Count: ", count), /* @__PURE__ */ React__default.default.createElement("button", { onClick: () => setCount((prev) => prev + 1) }, "Click me"));
  }
  ReactDOM__default.default.render(
    /* @__PURE__ */ React__default.default.createElement(App, null),
    document.getElementById("root")
  );
})($linkdesign.React, $linkdesign.ReactDOM);
```
:::

## 解决 IIFE 格式的打包问题

> 在上述示例中，Vite 6.x 以下的版本存在打包问题，`react` 没有被完全映射成 `$linkdesign.React`，因此需要用到 `rollup-plugin-external-globals` 插件。

> 具体问题参阅 https://github.com/rollup/rollup/issues/3188 。

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

## 构建时仅排除依赖

> 比如要排除 `node_modules` 内的依赖，可以使用 `externalizeDeps` 排除它们。或者使用 `nodeBuiltins` 排除 Nodejs 内置模块。

vite.config.mjs
```js
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';
import { globSync } from 'tinyglobby';
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