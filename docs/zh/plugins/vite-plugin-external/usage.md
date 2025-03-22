# 使用示例

## 基础使用

index.html
```html
<script src="//unpkg.com/react@18.3.1/umd/react.production.min.js"></script>
<script src="//unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js"></script>
```

vite.config.mjs
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
  ]
});
```

## 在不同的模式下覆盖externals

> 有时候可能开发环境和生产环境用到的 cdn 不一致。针对这种情况，可以配置 `development` 和 `production` 两个模式，分别对应开发环境和生产环境的外部依赖。

index.html
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

## 使用兼容的方式读取外部依赖

> 设置 `interop` 为 `'auto'` 即统一使用别名和缓存机制。

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

### 测试代码

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

### 对比输出内容

**`interop` 为 `'auto'` 时(Vite 6.x)**

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

**未配置 `interop`**

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

## 排除不需要打包的依赖

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

## 解决 IIFE 格式的打包问题

> 引入插件 `rollup-plugin-external-globals`，具体问题参阅 https://github.com/rollup/rollup/issues/3188

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
