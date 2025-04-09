# vite-plugin-include-css

[![npm package](https://nodei.co/npm/vite-plugin-include-css.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/vite-plugin-include-css)

> 当启用 `cssCodeSplit: false` 时，将所有CSS打包到单个JavaScript文件中。

[![NPM version](https://img.shields.io/npm/v/vite-plugin-include-css.svg?style=flat)](https://npmjs.org/package/vite-plugin-include-css)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-include-css.svg?style=flat)](https://npmjs.org/package/vite-plugin-include-css)
[![Node version](https://img.shields.io/node/v/vite-plugin-include-css.svg?style=flat)](https://npmjs.org/package/vite-plugin-include-css)

## Installation

::: code-group

```bash [npm]
npm add vite-plugin-include-css
```
```bash [pnpm]
pnpm add vite-plugin-include-css
```
```bash [yarn]
yarn add vite-plugin-include-css
```

:::

## Usage

```js
import { defineConfig } from 'vite';
import includeCSS from 'vite-plugin-include-css';

export default defineConfig({
  plugins: [
    includeCSS()
  ],
  build: {
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
        assetFileNames: 'assets/[name][extname]',
        entryFileNames: '[name].js',
        format: 'iife'
      }
    }
  }
});
```
