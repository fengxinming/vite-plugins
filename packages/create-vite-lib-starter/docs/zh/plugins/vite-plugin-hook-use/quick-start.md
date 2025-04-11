# vite-plugin-hook-use

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
