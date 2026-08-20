
::: danger This is Vite 1.x – 6.x LEGACY documentation archive / 这是 Vite 1.x – 6.x 旧版文档归档
- These pages correspond to old plugin releases: **vite-plugin-view ≤ 4.x, vite-plugin-external ≤ 7.x, vite-plugin-build-chunk ≤ 4.x, etc.**
- Bundler covered: Rollup + esbuild (the default Vite 6 and below stack). **This does NOT apply to Vite 8+ with the new Rolldown bundler**; Vite 7/8+ users, go to the current docs immediately.
- Content under this folder is frozen and unmaintained. For any new option / field, check the current docs:
  - Latest English docs: [/guide/introduction](/guide/introduction)
  - 最新中文文档：[/zh/guide/introduction](/zh/guide/introduction)
:::
# Usage Examples (legacy)

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
          resolveModule(importer, libName) {
            return {
              es: `${libName}/es/${decamelize(importer)}`,
              cjs: `${libName}/lib/${decamelize(importer)}`
            };
          },
          insertSideEffect(importer, libName) {
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
2. The `resolveModule` function specifies the new module paths.
3. The `insertSideEffect` function adds style imports automatically.
4. The compiled output shows separated imports for `antd` components and their styles.
