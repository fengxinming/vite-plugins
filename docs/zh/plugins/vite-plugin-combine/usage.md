# 使用示例

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
```mjs
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