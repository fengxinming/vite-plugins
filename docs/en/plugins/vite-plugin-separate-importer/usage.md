# Usage Examples

Configure in `vite.config.mjs`:
```js
import react from '@vitejs/plugin-react';
import { decamelize } from 'camel-kit';
import { defineConfig, Plugin } from 'vite';
import pluginExternal from 'vite-plugin-external';
import pluginSeparateImporter from 'vite-plugin-separate-importer';

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'classic'
    }),
    pluginExternal({
      externalizeDeps: ['antd', 'react']
    }),
    pluginSeparateImporter({
      logLevel: 'TRACE',
      libs: [
        {
          name: 'antd',
          importFrom(importer, libName) {
            return {
              es: `${libName}/es/${decamelize(importer)}`,
              cjs: `${libName}/lib/${decamelize(importer)}`
            };
          },
          insertFrom(importer, libName) {
            return {
              es: `${libName}/es/${decamelize(importer)}/style`,
              cjs: `${libName}/lib/${decamelize(importer)}/style`
            };
          }
        }
      ]
    })
  ],
  build: {
    minify: false,
    lib: {
      formats: ['es', 'cjs'],
      entry: ['src/index.tsx'],
      fileName(format, entryName) {
        return entryName + (format === 'es' ? '.mjs' : '.js');
      }
    }
  }
});
```

---

## Component Wrapping Example

`src/index.tsx`:
```tsx
import { Button } from 'antd';

export function WrappedButton() {
  return <Button>Wrapped Button</Button>;
}
```

---

## Compiled Output
```js
import Button from "antd/es/button";
import "antd/es/button/style";
function WrappedButton() {
  return /* @__PURE__ */ React.createElement(Button, null, "Wrapped Button");
}
export {
  WrappedButton
};
```

---

### Explanation
1. The plugin transforms batch imports into individual file imports.
2. The `importFrom` function specifies the new module paths.
3. The `insertFrom` function adds style imports automatically.
4. The compiled output shows separated imports for `antd` components and their styles.