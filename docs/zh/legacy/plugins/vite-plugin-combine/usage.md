
::: danger 这是 Vite 1.x – 6.x 旧版文档归档 / This is Vite 1.x – 6.x legacy archive
- 本文档对应插件版本：**vite-plugin-view ≤ 4.x、vite-plugin-external ≤ 7.x、vite-plugin-build-chunk ≤ 4.x 等旧发行版**。
- 适用打包器：Rollup / esbuild（Vite 6 及之前的默认组合）。**不支持 Vite 8+ 的 Rolldown 打包器**，Vite 7/8+ 用户请立即返回新文档。
- 本目录内容已冻结，不再维护。遇到新功能/新字段请查看最新文档：
  - 中文新文档：<a href="/zh/plugins/">/zh/plugins/</a>
  - English new docs：<a href="/plugins/">/plugins/</a>
:::
# 使用示例（旧版）

假设你有以下文件结构：

```
src/
  |- components/
  |     |- Button.ts
  |     |- Input.ts
  |     |- Select.ts
```

配置如下：

```typescript
import { defineConfig } from 'vite';
import pluginCombine from 'vite-plugin-combine';

export default defineConfig({
  plugins: [
    pluginCombine({
      src: 'src/components/**/*.ts',
      target: 'src/index.ts',
      exports: 'named',
      nameExport: (name, filePath) => `my${name}`
    })
  ],
  build: {
    minify: false,
    lib: {
      entry: [],
      formats: ['es', 'cjs'],
      fileName: '[name]'
    }
  }
});
```

输出的文件内容：

`dist/index.mjs`
```js
export { default as default2 } from './Button';
export { default as default3 } from './Input';
export { default as default4 } from './Select';

export {
  default2 as myButton,
  default3 as myInput,
  default4 as mySelect
};
```

`dist/index.js`
```js
"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const Button = require("./Button.js");
const Input = require("./Input.js");
const Select = require("./Select.js");
exports.Button = Button;
exports.Input = Input;
exports.Select = Select;
```