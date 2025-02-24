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
      src: 'src/**/*.ts', // 匹配要组合的文件路径
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

```ts
export type NameExport = (name: string, filePath: string) => string;

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
   * Name exports.
   *
   * 给导出的内容命名
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

| Option Name  | Type                          | Default Value | Description                                                                 |
| ------------ | ----------------------------- | ------------- | --------------------------------------------------------------------------- |
| src          | string                        | -             | Source file matching pattern, supports glob syntax                         |
| target       | string                        | `'index.js'`  | Target file path                                                            |
| exports      | `'named'` \| `'default'` \| `'none'` | `'named'` | Export type: named exports, default export, no exports                     |
| nameExport   | boolean \| function           | `true`        | Enable camel case conversion or provide a custom function for export names  |
| enforce      | `'pre'` \| `'post'`           | `'pre'`       | Plugin execution timing, `pre` before other plugins, `post` after other plugins |
| cwd          | string                        | `process.cwd()` | Current working directory, defaults to project root directory               |

## Example

Assuming you have the following file structure:

```
src/
  |- components/
  |     |- Button.ts
  |     |- Input.ts
  |     |- Select.ts
  |- index.ts
```

Configure as follows:

```typescript
combine({
  src: './src/components/**/*.ts',
  target: './src/index.ts',
  exports: 'named',
  nameExport: (name, filePath) => `my${name}`
})
```

This will generate the following `src/index.ts` file:

```typescript
export { default as myButton } from './components/Button';
export { default as myInput } from './components/Input';
export { default as mySelect } from './components/Select';
```

## Examples

* [vite3 demo](../../examples/vite3-demo)
* [vite4 demo](../../examples/vite4-demo)
* [vite5 demo](../../examples/vite5-demo)
* [vite6 demo](../../examples/vite6-demo)