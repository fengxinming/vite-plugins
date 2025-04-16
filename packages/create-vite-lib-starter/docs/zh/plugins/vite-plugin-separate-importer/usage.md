# 使用示例

在 `vite.config.mjs` 中配置：
```js
import react from '@vitejs/plugin-react';
import decamelize from 'decamelize';
import { defineConfig, Plugin } from 'vite';
import pluginExternal from 'vite-plugin-external';
import pluginSeparateImporter from 'vite-plugin-separate-importer';

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'classic'
    }) as unknown as Plugin,
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

## 二次封装组件

`src/index.tsx`
```tsx
import { Button } from 'antd';

export function WrappedButton() {
  return <Button>Wrapped Button</Button>;
}
```


## 编译后的输出
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