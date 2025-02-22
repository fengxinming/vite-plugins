# vite-plugin-combine

[![npm package](https://nodei.co/npm/vite-plugin-combine.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/vite-plugin-combine)

> Combines specified files to produce a single master file. Vite >= 3.1
> 组合文件生成一个主文件。

[![NPM version](https://img.shields.io/npm/v/vite-plugin-combine.svg?style=flat)](https://npmjs.org/package/vite-plugin-combine)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-combine.svg?style=flat)](https://npmjs.org/package/vite-plugin-combine)

## Installation

```bash
npm install vite-plugin-combine --save-dev
```

## Options

```ts
export interface Options {
  /**
   * Files prepared for combine.
   *
   * 准备合并的文件
   */
  src: string | string[];
  /**
   * Combines into the target file.
   *
   * 组合到目标文件
   *
   * @default 'index.js'
   */
  target: string;

  /**
   * Whether to overwrite the target file.
   *
   * 是否覆盖目标文件
   *
   * @default false
   */
  overwrite?: boolean;

  /**
   * Transforms file names.
   *
   * 转换文件名
   */
  transformName?: TransformName | boolean;

  /**
   * Exported module types.
   *
   * 导出的模块类型
   *
   * @default 'named'
   */
  exports?: 'named' | 'default' | 'none';

  /**
   * The value of enforce can be either `"pre"` or `"post"`, see more at https://vitejs.dev/guide/api-plugin.html#plugin-ordering.
   *
   * 强制执行顺序，`pre` 前，`post` 后，参考 https://cn.vitejs.dev/guide/api-plugin.html#plugin-ordering。
   */
  enforce?: 'pre' | 'post';

  /**
   * Current Working Directory.
   *
   * 当前工作目录
   */
  cwd?: string;
}
```

**`src`**
* Type: `string | string[]`
* Required: true

Files prepared for merging.

**`target`**
* Type: `string`
* Required: true
* Default: `'index.js'`

Merging into the target file.

**`overwrite`**
* Type: `boolean`
* Required: false

Whether to overwrite the target file.

**`transformName`**
* Type: `TransformName | boolean`
* Required: false

Transform file names.

**`exports`**
* Type: `'named' | 'default' | 'none'`
* Required: false

Exported module types.

**`cwd`**
* Type: `string`
* Required: false
* Default: `process.cwd()`

Current Working Directory.

## Usage

```dir
.
├── src
│   ├── isAsyncFunction.ts
│   ├── isDate.ts
│   ├── isError.ts
│   ├── isNil.ts
│   └── isNumber.ts
```

```js
import { defineConfig } from 'vite';
import ts from '@rollup/plugin-typescript';
import vitePluginCombine from 'vite-plugin-combine';

export default defineConfig({
  plugins: [
    vitePluginCombine({
      src: 'src/*.ts',
      target: 'src/index.ts'
    }),
    ts()
  ],
  build: {
    minify: false,
    lib: {
      formats: ['es'],
      fileName: '[name]'
    }
  }
});
```

### Output

dist/index.js
```js
import { default as default2 } from "./isAsyncFunction.js";
import { default as default3 } from "./isDate.js";
import { default as default4 } from "./isError.js";
import { default as default5 } from "./isNil.js";
import { default as default6 } from "./isNumber.js";
export {
  default2 as isAsyncFunction,
  default3 as isDate,
  default4 as isError,
  default5 as isNil,
  default6 as isNumber
};
```

dist/index.d.ts
```ts
export { default as isAsyncFunction } from './isAsyncFunction';
export { default as isDate } from './isDate';
export { default as isError } from './isError';
export { default as isNil } from './isNil';
export { default as isNumber } from './isNumber';
```

## Examples

* [See vite3 demo](../../examples/vite3-demo)
* [See vite4 demo](../../examples/vite4-demo)
* [See vite5 demo](../../examples/vite5-demo)
* [See vite6 demo](../../examples/vite6-demo)