
::: danger This is Vite 1.x – 6.x LEGACY documentation archive / 这是 Vite 1.x – 6.x 旧版文档归档
- These pages correspond to old plugin releases: **vite-plugin-view ≤ 4.x, vite-plugin-external ≤ 7.x, vite-plugin-build-chunk ≤ 4.x, etc.**
- Bundler covered: Rollup + esbuild (the default Vite 6 and below stack). **This does NOT apply to Vite 8+ with the new Rolldown bundler**; Vite 7/8+ users, go to the current docs immediately.
- Content under this folder is frozen and unmaintained. For any new option / field, check the current docs:
  - Latest English docs: [/guide/introduction](/guide/introduction)
  - 最新中文文档：[/zh/guide/introduction](/zh/guide/introduction)
:::
# vite-plugin-include-css (legacy)

[![npm package](https://nodei.co/npm/vite-plugin-include-css.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/vite-plugin-include-css)

> When `cssCodeSplit: false` is enabled, all CSS will be bundled into a single JavaScript file.

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
