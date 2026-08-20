
::: danger 这是 Vite 1.x – 6.x 旧版文档归档 / This is Vite 1.x – 6.x legacy archive
- 本文档对应插件版本：**vite-plugin-view ≤ 4.x、vite-plugin-external ≤ 7.x、vite-plugin-build-chunk ≤ 4.x 等旧发行版**。
- 适用打包器：Rollup / esbuild（Vite 6 及之前的默认组合）。**不支持 Vite 8+ 的 Rolldown 打包器**，Vite 7/8+ 用户请立即返回新文档。
- 本目录内容已冻结，不再维护。遇到新功能/新字段请查看最新文档：
  - 中文新文档：<a href="/zh/plugins/">/zh/plugins/</a>
  - English new docs：<a href="/plugins/">/plugins/</a>
:::
# vite-plugin-hook-use（旧版）

[![npm package](https://nodei.co/npm/vite-plugin-hook-use.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/vite-plugin-hook-use)

> 显示 `vite` 调用其钩子函数的序列和频率

[![NPM version](https://img.shields.io/npm/v/vite-plugin-hook-use.svg?style=flat)](https://npmjs.org/package/vite-plugin-hook-use)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-hook-use.svg?style=flat)](https://npmjs.org/package/vite-plugin-hook-use)
[![Node version](https://img.shields.io/node/v/vite-plugin-hook-use.svg?style=flat)](https://npmjs.org/package/vite-plugin-hook-use)

## Installation

::: code-group

```bash [npm]
npm add vite-plugin-hook-use
```
```bash [pnpm]
pnpm add vite-plugin-hook-use
```
```bash [yarn]
yarn add vite-plugin-hook-use
```

:::

## Usage

```js
import { defineConfig } from 'vite';
import vitePluginHookUse from 'vite-plugin-hook-use';

export default defineConfig({
  plugins: [
    vitePluginHookUse()
  ]
});
```
