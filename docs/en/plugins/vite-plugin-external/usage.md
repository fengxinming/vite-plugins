# Usage Examples

## Basic Usage

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

## Dynamic Configuration of Global Variable Names

```js
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
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
        format: 'iife'
      }
    }
  }
});
```

## Multi-Environment Configuration

> Sometimes development and production environments use different CDNs. You can configure `development` and `production` modes for respective external dependencies.

development `index.html`
```html
<script src="//unpkg.com/react@18.3.1/umd/react.development.js"></script>
<script src="//unpkg.com/react-dom@18.3.1/umd/react.development.js"></script>
```

production `index.html`
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

## Adjusting Build Strategies

> The plugin uses two strategies during development runtime and build time.  
> During development runtime, it maps dependencies to `module.exports = ${globalName};`.  
> During build time, it configures Rollup's `external` and `output` options.  
> The `interop` option controls whether to use the first strategy.

Example configuration:

`vite.config.mjs`
```js
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    pluginExternal({
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

**Before Build**

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

### Setting `interop` to `'auto'`

**After Build**

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

### Without Setting `interop`

**After Build**

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

## Solving IIFE Build Issues

> For Vite versions below 6.x, use `rollup-plugin-external-globals` to resolve incomplete mapping.  
> See https://github.com/rollup/rollup/issues/3188.

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

## Excluding Dependencies During Build

vite.config.mjs
```js
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';
import { globSync } from 'tinyglobby';
import { dependencies } from './package.json';

export default defineConfig({
  plugins: [
    pluginExternal({
      nodeBuiltins: true,
      externalizeDeps: Object.keys(dependencies)
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