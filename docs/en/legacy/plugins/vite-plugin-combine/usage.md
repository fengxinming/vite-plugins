
::: danger This is Vite 1.x – 6.x LEGACY documentation archive / 这是 Vite 1.x – 6.x 旧版文档归档
- These pages correspond to old plugin releases: **vite-plugin-view ≤ 4.x, vite-plugin-external ≤ 7.x, vite-plugin-build-chunk ≤ 4.x, etc.**
- Bundler covered: Rollup + esbuild (the default Vite 6 and below stack). **This does NOT apply to Vite 8+ with the new Rolldown bundler**; Vite 7/8+ users, go to the current docs immediately.
- Content under this folder is frozen and unmaintained. For any new option / field, check the current docs:
  - Latest English docs: [/guide/introduction](/guide/introduction)
  - 最新中文文档：[/zh/guide/introduction](/zh/guide/introduction)
:::
# Usage Examples (legacy)

Assuming the following file structure:

```
src/
  |- components/
  |     |- Button.ts
  |     |- Input.ts
  |     |- Select.ts
```

Configure the plugin as:

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
      formats: ['es', 'cjs'],
      fileName: '[name]'
    }
  }
});
```

This will generate the following files:

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
