# Usage Examples

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