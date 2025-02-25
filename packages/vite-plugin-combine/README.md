# vite-plugin-combine

[![npm package](https://nodei.co/npm/vite-plugin-combine.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/vite-plugin-combine)

> `vite-plugin-combine` is a Vite plugin that combines multiple module files into a single target file. It supports various export types (named exports, default exports, no exports) and can automatically generate corresponding import statements based on configuration. (Vite >= 3.1)

[![NPM version](https://img.shields.io/npm/v/vite-plugin-combine.svg?style=flat)](https://npmjs.org/package/vite-plugin-combine)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-combine.svg?style=flat)](https://npmjs.org/package/vite-plugin-combine)

## English | [中文](README_zh-CN.md)

## Installation

```bash
npm install vite-plugin-combine --save-dev
```

## Usage

Import and configure the plugin in your `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import combine from 'vite-plugin-combine';

export default defineConfig({
  plugins: [
    combine({
      src: 'src/*.ts', // 匹配要组合的文件路径
      target: 'src/index.ts', // 目标文件路径
      exports: 'named', // 导出类型：'named' | 'default' | 'none'
    })
  ],
  resolve: {
    preserveSymlinks: true
  },
  build: {
    minify: false,
    lib: {
      formats: ['es', 'cjs'],
      fileName: '[name]'
    }
  }
});
```

## Configuration Options

### `src`

- **Type**: `string | string[]`
- **Description**: Pattern to match source files, supports glob syntax.

### `target`

- **Type**: `string`
- **Default Value**: `'index.js'`
- **Description**: Path to the target file after combination.

### `exports`

- **Type**: `'named' | 'default' | 'none'`
- **Default Value**: `'named'`
- **Description**: Export type, optional values: `'named'` (named export), `'default'` (default export), `'none'` (no export).

### `overwrite`

- **Type**: `boolean`
- **Description**: Whether to overwrite the existing target file if it exists.

### `nameExport`

- **Type**: `boolean | function`
- **Default Value**: `true`
- **Description**: Whether to enable camel case naming or provide a custom function to generate export names.

### `enforce`

- **Type**: `'pre' | 'post'`
- **Default Value**: `'pre'`
- **Description**: Plugin execution order, `pre` means before other plugins, `post` means after other plugins.

### `cwd`

- **Type**: `string`
- **Default Value**: `process.cwd()`
- **Description**: Current working directory, defaults to the project root directory.

```ts
export type NameExport = (name: string, filePath: string) => string;

export interface Options {
  /**
   * Path to the files to be combined, supports glob patterns.
   *
   * 需要合并的文件路径，支持 glob 模式。
   */
  src: string | string[];
  /**
   * Path to the target file after combination.
   *
   * 合并后的目标文件路径。
   *
   * @default 'index.js'
   */
  target: string;

  /**
   * Whether to overwrite the existing target file。
   *
   * 是否覆盖已存在的目标文件。
   *
   * @default false
   */
  overwrite?: boolean;

  /**
   * Custom function or boolean value for controlling the generation of export names.
   *
   * 自定义导出名称的函数或布尔值，用于控制导出名称的生成方式。
   */
  nameExport?: NameExport | boolean;

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

## Example

Assuming you have the following file structure:

```
src/
  |- components/
  |     |- Button.ts
  |     |- Input.ts
  |     |- Select.ts
```

Configure as follows:

```ts
pluginCombine({
  src: 'src/components/**/*.ts',
  target: 'src/index.ts',
  exports: 'named',
  nameExport: (name, filePath) => `my${name}`
})
```

This will generate the following `src/index.ts` file:

```ts
export { default as myButton } from './components/Button';
export { default as myInput } from './components/Input';
export { default as mySelect } from './components/Select';
```

## Notes

- If the target file already exists and the `overwrite` option is `false`, the plugin will throw an error.
- The plugin will automatically clean up the generated target file when the process exits, unless the `overwrite` option is `true`.

## Examples

* [vite3 demo](../../examples/vite3-demo)
* [vite4 demo](../../examples/vite4-demo)
* [vite5 demo](../../examples/vite5-demo)
* [vite6 demo](../../examples/vite6-demo)