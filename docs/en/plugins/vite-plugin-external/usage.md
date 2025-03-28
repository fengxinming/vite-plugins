# Usage Examples

## Basic Usage

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

## Multi-mode Configuration

> Sometimes different CDNs are used in development and production environments. To handle this, configure modes like `development` and `production` for respective external dependencies.

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

## Runtime Detection of External Dependencies

> Set `interop` to `'auto'` to inject helper functions for runtime detection of external dependencies.

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

### Test Code

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

### Output Comparison

**When `interop` is set to `'auto'` (Vite 6.x):**

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

**Without `interop` Configuration:**

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

## Exclude Dependencies During Build

> To exclude dependencies from `node_modules`, use `externalizeDeps`. Or use `nodeBuiltins` to exclude Node.js built-in modules.

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

## Resolve IIFE Packaging Issues

> Use plugin `rollup-plugin-external-globals` to fix issues like [Rollup#3188](https://github.com/rollup/rollup/issues/3188).

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
