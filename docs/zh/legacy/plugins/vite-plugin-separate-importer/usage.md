
::: danger 这是 Vite 1.x – 6.x 旧版文档归档 / This is Vite 1.x – 6.x legacy archive
- 本文档对应插件版本：**vite-plugin-view ≤ 4.x、vite-plugin-external ≤ 7.x、vite-plugin-build-chunk ≤ 4.x 等旧发行版**。
- 适用打包器：Rollup / esbuild（Vite 6 及之前的默认组合）。**不支持 Vite 8+ 的 Rolldown 打包器**，Vite 7/8+ 用户请立即返回新文档。
- 本目录内容已冻结，不再维护。遇到新功能/新字段请查看最新文档：
  - 中文新文档：<a href="/zh/plugins/">/zh/plugins/</a>
  - English new docs：<a href="/plugins/">/plugins/</a>
:::
# 使用示例（旧版）

在 `vite.config.mjs` 中配置：
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