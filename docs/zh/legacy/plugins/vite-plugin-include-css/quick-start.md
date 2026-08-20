
::: danger 这是 Vite 1.x – 6.x 旧版文档归档 / This is Vite 1.x – 6.x legacy archive
- 本文档对应插件版本：**vite-plugin-view ≤ 4.x、vite-plugin-external ≤ 7.x、vite-plugin-build-chunk ≤ 4.x 等旧发行版**。
- 适用打包器：Rollup / esbuild（Vite 6 及之前的默认组合）。**不支持 Vite 8+ 的 Rolldown 打包器**，Vite 7/8+ 用户请立即返回新文档。
- 本目录内容已冻结，不再维护。遇到新功能/新字段请查看最新文档：
  - 中文新文档：<a href="/zh/plugins/">/zh/plugins/</a>
  - English new docs：<a href="/plugins/">/plugins/</a>
:::
# vite-plugin-include-css（旧版）

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
