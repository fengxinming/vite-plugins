# vite-plugin-hook-use

[![npm package](https://nodei.co/npm/vite-plugin-hook-use.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/vite-plugin-hook-use)

> 显示 `vite` 调用其钩子函数的序列和频率

[![NPM version](https://img.shields.io/npm/v/vite-plugin-hook-use.svg?style=flat)](https://npmjs.org/package/vite-plugin-hook-use)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-hook-use.svg?style=flat)](https://npmjs.org/package/vite-plugin-hook-use)
[![Node version](https://img.shields.io/node/v/vite-plugin-hook-use.svg?style=flat)](https://npmjs.org/package/vite-plugin-hook-use)

## 安装

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

## 用法

```js
import { defineConfig } from 'vite';
import vitePluginHookUse from 'vite-plugin-hook-use';

export default defineConfig({
  plugins: [
    vitePluginHookUse()
  ]
});
```

## 配置选项

### `enableBanner`

- **类型**：`boolean`
- **必填**：`false`
- **默认值**：`true`

启动时是否输出插件 banner。

```js
vitePluginHookUse({ enableBanner: false })
```
