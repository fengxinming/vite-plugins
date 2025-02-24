# vite-plugin-combine

[![npm package](https://nodei.co/npm/vite-plugin-combine.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/vite-plugin-combine)

> `vite-plugin-combine` 是一个 Vite 插件，用于将多个模块文件组合成一个目标文件。它支持多种导出方式（命名导出、默认导出、无导出），并可以根据配置自动生成相应的导入语句。(Vite >= 3.1)

[![NPM version](https://img.shields.io/npm/v/vite-plugin-combine.svg?style=flat)](https://npmjs.org/package/vite-plugin-combine)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-combine.svg?style=flat)](https://npmjs.org/package/vite-plugin-combine)

## [English](README.md) | 中文

## 安装

使用 npm 或 yarn 安装插件：

```bash
npm install vite-plugin-combine --save-dev
```

## 使用方法

在 `vite.config.ts` 中引入并配置插件：

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

## 配置项

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

| 参数名       | 类型                | 默认值          | 描述                                                         |
| ------------ | ------------------- | --------------- | ------------------------------------------------------------ |
| src          | string              | -               | 源文件匹配模式，支持 glob 语法                               |
| target       | string              | `'index.js'`    | 目标文件路径                                                 |
| exports      | `'named'` \| `'default'` \| `'none'` | `'named'` | 导出类型：命名导出、默认导出、不导出                       |
| nameExport   | boolean \| function | `true`          | 是否启用驼峰命名转换，或提供自定义函数生成导出名称           |
| enforce      | `'pre'` \| `'post'`  | `'pre'`         | 插件执行时机，`pre` 表示在其他插件之前执行，`post` 表示在其他插件之后执行 |
| cwd          | string              | `process.cwd()` | 当前工作目录，默认为项目根目录                               |

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
combine({
  src: './src/components/**/*.ts',
  target: './src/index.ts',
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

## 示例

* [vite3 demo](../../examples/vite3-demo)
* [vite4 demo](../../examples/vite4-demo)
* [vite5 demo](../../examples/vite5-demo)
* [vite6 demo](../../examples/vite6-demo)