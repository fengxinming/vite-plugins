
::: danger This is Vite 1.x – 6.x LEGACY documentation archive / 这是 Vite 1.x – 6.x 旧版文档归档
- These pages correspond to old plugin releases: **vite-plugin-view ≤ 4.x, vite-plugin-external ≤ 7.x, vite-plugin-build-chunk ≤ 4.x, etc.**
- Bundler covered: Rollup + esbuild (the default Vite 6 and below stack). **This does NOT apply to Vite 8+ with the new Rolldown bundler**; Vite 7/8+ users, go to the current docs immediately.
- Content under this folder is frozen and unmaintained. For any new option / field, check the current docs:
  - Latest English docs: [/guide/introduction](/guide/introduction)
  - 最新中文文档：[/zh/guide/introduction](/zh/guide/introduction)
:::
# vite-plugin-cp (legacy)

[![npm package](https://nodei.co/npm/vite-plugin-cp.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/vite-plugin-cp)

> A powerful Vite plugin for copying files/directories with advanced transformation and renaming capabilities.

[![NPM version](https://img.shields.io/npm/v/vite-plugin-cp.svg?style=flat)](https://npmjs.org/package/vite-plugin-cp)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-cp.svg?style=flat)](https://npmjs.org/package/vite-plugin-cp)
[![Node version](https://img.shields.io/node/v/vite-plugin-cp.svg?style=flat)](https://npmjs.org/package/vite-plugin-cp)


## Installation

::: code-group

```bash [npm]
npm add vite-plugin-cp
```
```bash [pnpm]
pnpm add vite-plugin-cp
```
```bash [yarn]
yarn add vite-plugin-cp
```

:::

## Features
- 📁 Supports copying files/directories using glob patterns
- 🔄 Flexible file transformation before copying
- 📦 Preserves or flattens directory structures
- 🛠️ Customizable file renaming
- 🔄 Works with both JavaScript and TypeScript projects
- ⚡ Runs during Vite's build lifecycle

## Usage

```js
import { defineConfig } from 'vite';
import cp from 'vite-plugin-cp';

export default defineConfig({
  plugins: [
    cp({
      targets: [
        // Copy all files from 'node_modules/vite/dist' to 'dist/cp/test'
        { src: './node_modules/vite/dist', dest: 'dist/cp/test', flatten: true },

        // Copy all files from 'node_modules/vite/dist' to 'dist/cp/test2', but keep the directory structure
        { src: './node_modules/vite/dist', dest: 'dist/cp/test2' },

        // Copy the README.md file from 'node_modules/vite' to 'dist/cp'
        { src: './node_modules/vite/README.md', dest: 'dist/cp' },

        { src: './node_modules/vite/index.cjs', dest: 'dist/cp', rename: 'index.js' },

        // Copy all .ts files from 'node_modules/vite' to 'dist/cp/types'
        { src: './node_modules/vite/**/*.ts', dest: 'dist/cp/types' },

        // Copy all .ts files from 'node_modules/vite' to 'dist/cp/types2', but modify the name
        {
          src: './node_modules/vite/**/*.ts', dest: 'dist/cp/types2', rename(name) {
            return name.replace('.d.ts', '.ts');
          }
        },

        // Copy the package.json file from 'node_modules/vite' to 'dist/cp', but modify the name and version
        {
          src: './node_modules/vite/package.json', dest: 'dist/cp', transform(buf: Buffer) {
            const pkg = JSON.parse(buf.toString());
            return JSON.stringify({
              ...pkg,
              name: 'vite-plugin-cp-test',
              version: '1.0.0'
            }, null, 2);
          }
        }
      ]
    })
  ]
});
```
