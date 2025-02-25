# vite-plugin-combine

[![npm package](https://nodei.co/npm/vite-plugin-combine.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/vite-plugin-combine)

> `vite-plugin-combine` 是一个用于 Vite 的插件，能够将多个模块文件合并成一个目标文件。它支持命名导出、默认导出和无导出三种模式，并可以根据配置自动生成相应的导入语句。适用于 Vite 3.1 及以上版本。

[![NPM version](https://img.shields.io/npm/v/vite-plugin-combine.svg?style=flat)](https://npmjs.org/package/vite-plugin-combine)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-combine.svg?style=flat)](https://npmjs.org/package/vite-plugin-combine)

## [English](README.md) | 中文

## 安装

使用 npm 安装插件：

```bash
npm install vite-plugin-combine --save-dev
```

## 使用方法

在 `vite.config.ts` 中引入并配置插件：

```typescript
import { defineConfig } from 'vite';
import pluginCombine from 'vite-plugin-combine';

export default defineConfig({
  plugins: [
    pluginCombine({
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

## 配置项

### `src`

- **类型**: `string | string[]`
- **描述**: 需要合并的文件路径，支持 glob 模式。

### `target`

- **类型**: `string`
- **默认值**: `'index.js'`
- **描述**: 合并后的目标文件路径。

### `exports`

- **类型**: `'named' | 'default' | 'none'`
- **默认值**: `'named'`
- **描述**: 导出类型，可选值为 `'named'`（命名导出）、`'default'`（默认导出）、`'none'`（无导出）。

### `overwrite`

- **类型**: `boolean`
- **描述**: 如果目标文件已存在，是否覆盖原文件。

### `nameExport`

- **类型**: `boolean | function`
- **默认值**: `true`
- **描述**: 是否启用驼峰命名转换，或提供自定义函数生成导出名称。

### `enforce`

- **类型**: `'pre' | 'post'`
- **默认值**: `'pre'`
- **描述**: 插件执行顺序，`pre` 表示在其他插件之前执行，`post` 表示在其他插件之后执行。

### `cwd`

- **类型**: `string`
- **默认值**: `process.cwd()`
- **描述**: 当前工作目录，默认为项目根目录。

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

## 示例

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
pluginCombine({
  src: 'src/components/**/*.ts',
  target: 'src/index.ts',
  exports: 'named',
  nameExport: (name, filePath) => `my${name}`
})
```

将会生成如下的 `src/index.ts` 文件：

```typescript
export { default as myButton } from './components/Button';
export { default as myInput } from './components/Input';
export { default as mySelect } from './components/Select';
```

## 注意事项

- 如果目标文件已存在且 `overwrite` 选项为 `false`，插件会抛出错误。
- 插件会在进程退出时自动清理生成的目标文件，除非 `overwrite` 选项为 `true`。

## 示例

* [vite3 demo](../../examples/vite3-demo)
* [vite4 demo](../../examples/vite4-demo)
* [vite5 demo](../../examples/vite5-demo)
* [vite6 demo](../../examples/vite6-demo)