# vite-plugin-cp

[![npm package](https://nodei.co/npm/vite-plugin-cp.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/vite-plugin-cp)

> Copy files after building bundles. Vite >= 3.1

[![NPM version](https://img.shields.io/npm/v/vite-plugin-cp.svg?style=flat)](https://npmjs.org/package/vite-plugin-cp)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-cp.svg?style=flat)](https://npmjs.org/package/vite-plugin-cp)

## Installation

```bash
npm install vite-plugin-cp --save-dev
```

## Options

```ts
export interface Target {
  src: string | string[];
  dest: string;
  rename?: string | ((name: string) => string);
  flatten?: boolean;
  transform?: (buf: Buffer, matchedPath: string) => string | Buffer | Promise<string | Buffer>;
}
export interface Options {
  hook?: string;
  enforce?: 'pre' | 'post';
  globbyOptions?: GlobbyOptions;
  cwd?: string;
  targets: Target[];
}
```

* `hook` - Default `'writeBundle'`, vite hook the plugin should use.
* `enforce` - it may be needed to enforce the order of the plugin or only apply at build time. 
* `globbyOptions` - [globby options](https://github.com/mrmlnc/fast-glob#options-3)
* `cwd` - Default `process.cwd()`, The current working directory in which to search.
* `targets` - Array of targets to copy.A target is an object with properties:

  * src - Path or glob of what to copy.
  * dest - One or more destinations where to copy.
  * rename - Change destination file.
  * flatten - Remove the directory structure of copied files.
  * transform - Modify file contents.


## Usage

```js
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
        { src: './node_modules/vite/README.md', dest: 'dist' }
      ]
    })
  ]
});
```

## Examples

**[See demo](examples/react)**
