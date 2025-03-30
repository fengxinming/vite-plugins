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
  ]
});
```

## Dynamic Configuration of Global Variable Names

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

## Multi-Environment Configuration

> Sometimes development and production environments use different CDNs. You can configure `development` and `production` modes for respective external dependencies.

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

## Adjusting Build Strategies

> The plugin uses two strategies during development runtime and build time.  
> During development runtime, it maps dependencies to `module.exports = ${globalName};`.  
> During build time, it configures Rollup's `external` and `output` options.  
> The `interop` option controls whether to use the first strategy.

Example configuration:

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
  // ... (code remains unchanged)
});
```

```js [Vite 5.x]
(function() {
  // ... (code remains unchanged)
});
```

```js [Vite 4.x]
(function() {
  // ... (code remains unchanged)
});
```

```js [Vite 3.x]
(function() {
  // ... (code remains unchanged)
});
```

:::

### Without Setting `interop`

**After Build**

::: code-group
```js [Vite 6.x]
(function(React, ReactDOM) {
  // ... (code remains unchanged)
})($linkdesign.React, $linkdesign.ReactDOM);
```

```js [Vite 5.x]
(function(React, ReactDOM) {
  // ... (code remains unchanged)
})($linkdesign.React, $linkdesign.ReactDOM);
```

```js [Vite 4.x]
(function(React, ReactDOM) {
  // ... (code remains unchanged)
})($linkdesign.React, $linkdesign.ReactDOM);
```

```js [Vite 3.x]
(function(React, ReactDOM) {
  // ... (code remains unchanged)
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