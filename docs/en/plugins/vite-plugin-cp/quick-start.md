# vite-plugin-cp

[![npm package](https://nodei.co/npm/vite-plugin-cp.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/vite-plugin-cp)

[![NPM version](https://img.shields.io/npm/v/vite-plugin-cp.svg?style=flat)](https://npmjs.org/package/vite-plugin-cp)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-cp.svg?style=flat)](https://npmjs.org/package/vite-plugin-cp)

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
        { src: './node_modules/vite/dist', dest: 'dist/cp/test' },

        // Copy all files from 'node_modules/vite/dist' to 'dist/cp/test2', but keep the directory structure
        { src: './node_modules/vite/dist', dest: 'dist/cp/test2', flatten: false },

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
