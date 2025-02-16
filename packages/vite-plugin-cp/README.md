# vite-plugin-cp

[![npm package](https://nodei.co/npm/vite-plugin-cp.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/vite-plugin-cp)

> Copy files after building bundles. Vite >= 3.1
> 打包之后复制文件

[![NPM version](https://img.shields.io/npm/v/vite-plugin-cp.svg?style=flat)](https://npmjs.org/package/vite-plugin-cp)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-cp.svg?style=flat)](https://npmjs.org/package/vite-plugin-cp)

## Installation

```bash
npm install vite-plugin-cp --save-dev
```

## Options

```ts
export interface Target {
  /**
   * Path or glob of what to copy.
   *
   * 要复制的目录、文件或者 `globby` 匹配规则。
   */
  src: string | string[];

  /**
   * One or more destinations where to copy.
   *
   * 复制到目标目录。
   */
  dest: string;

  /**
   * Rename the file after copying.
   *
   * 复制后重命名文件。
   */
  rename?: string | ((name: string) => string);

  /**
   * Remove the directory structure of copied files, if `src` is a directory.
   *
   * 是否删除复制的文件目录结构，`src` 为目录时有效。
   */
  flatten?: boolean;

  /**
   * Options for globby. See more at https://github.com/sindresorhus/globby#options
   *
   * globby 的选项，设置 `src` 的匹配参数
   */
  globbyOptions?: GlobbyOptions;

  /**
   * Transform the file before copying.
   *
   * 复制前转换文件内容。
   */
  transform?: (buf: Buffer, matchedPath: string) => string | Buffer | Promise<string | Buffer>;
}

export interface Options {
  /**
   * Default `'closeBundle'`, vite hook the plugin should use.
   *
   * 默认 `'closeBundle'`，调用到指定钩子函数时开始复制。
   */
  hook?: string;

  /**
   * The value of enforce can be either `"pre"` or `"post"`, see more at https://vitejs.dev/guide/api-plugin.html#plugin-ordering.
   *
   * 强制执行顺序，`pre` 前，`post` 后，参考 https://cn.vitejs.dev/guide/api-plugin.html#plugin-ordering
   */
  enforce?: 'pre' | 'post';

  /**
   * Options for globby. See more at https://github.com/sindresorhus/globby#options
   *
   * globby 的选项，设置 `src` 的匹配参数
   */
  globbyOptions?: GlobbyOptions;

  /**
   * Default `process.cwd()`, The current working directory in which to search.
   *
   * 默认 `process.cwd()`，在该目录下搜索。
   */
  cwd?: string;

  /**
   * Array of targets to copy.
   *
   * 复制文件的规则配置。
   */
  targets: Target[];
}
```

Option | Type | Default | Description
------ | ---- | ------- | -----------
`hook`          | `string`          | `'closeBundle'` | vite hook the plugin should use.<br/> 调用指定钩子函数时开始复制。
`enforce`       | `'pre' \| 'post'` | Optional        | The value of enforce can be either `"pre"` or `"post"`, see more at https://vitejs.dev/guide/api-plugin.html#plugin-ordering.<br/> 强制执行顺序，`pre` 前，`post` 后，参考 https://cn.vitejs.dev/guide/api-plugin.html#plugin-ordering
`globbyOptions` | `GlobbyOptions`   | Optional        | Options for globby. See more at https://github.com/sindresorhus/globby#options. <br/> globby 的选项，设置 `src` 的匹配参数。
`cwd`           | `string`          | `process.cwd()` | The current working directory in which to search. <br/> 用于拼接 `src` 的路径。
`targets`       | `Target[]`        | Optional        | Array of targets to copy. <br/> 复制文件的规则配置。

Target | Type | Default | Description
------ | ---- | ------- | -----------
`src`           | `string \| string[]` | Required | Path or glob of what to copy. <br/> 要复制的目录、文件或者 `globby` 匹配规则。
`dest`          | `string`             | Optional | One or more destinations where to copy. <br/> 复制到目标目录。
`rename`        | `string \| ((name: string) => string)` | Optional | Rename the file after copying. <br/> 
`flatten`       | `boolean`            | Optional | Remove the directory structure of copied files, if `src` is a directory. <br/> 是否删除复制的文件目录结构，`src` 为目录时有效。
`globbyOptions` | `GlobbyOptions`      | Optional | Options for globby. See more at https://github.com/sindresorhus/globby#options. <br/> globby 的选项，设置 `src` 的匹配参数
`transform`     | `(buf: Buffer, matchedPath: string) => string \| Buffer \| Promise<string \| Buffer>` | Optional | Transform the file before copying. <br/> 复制前转换文件内容。

## Usage

```js
import { defineConfig } from 'vite';
import cp from 'vite-plugin-cp';

export default defineConfig({
  plugins: [
    cp({
      targets: [
        // copy files of './node_modules/vite/dist' to 'dist/test'
        { src: './node_modules/vite/dist', dest: 'dist/test' },

        // copy files of './node_modules/vite/dist' to 'dist/test2' 
        // and keep the directory structure of copied files
        { src: './node_modules/vite/dist', dest: 'dist/test2', flatten: false },

        // copy './node_modules/vite/README.md' to 'dist'
        { src: './node_modules/vite/README.md', dest: 'dist' },

        // copy './node_modules/vite/**/*.ts' to 'dist/types'
        { src: './node_modules/vite/**/*.ts', dest: 'dist/types' }
      ]
    })
  ]
});
```

## Examples

* [See vite3 demo](../../examples/vite3-demo)
* [See vite4 demo](../../examples/vite4-demo)
* [See vite5 demo](../../examples/vite5-demo)
* [See vite6 demo](../../examples/vite6-demo)