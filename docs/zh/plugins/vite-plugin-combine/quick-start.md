# vite-plugin-combine

[![npm package](https://nodei.co/npm/vite-plugin-combine.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/vite-plugin-combine)

> 将多个模块文件合并成一个目标文件。它支持命名导出、默认导出、自动导出和无导出四种模式，并可以根据配置自动生成相应的导入语句。

[![NPM version](https://img.shields.io/npm/v/vite-plugin-combine.svg?style=flat)](https://npmjs.org/package/vite-plugin-combine)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-combine.svg?style=flat)](https://npmjs.org/package/vite-plugin-combine)
[![Node version](https://img.shields.io/node/v/vite-plugin-combine.svg?style=flat)](https://npmjs.org/package/vite-plugin-combine)

## 安装

::: code-group

```bash [npm]
npm add vite-plugin-combine
```
```bash [pnpm]
pnpm add vite-plugin-combine
```
```bash [yarn]
yarn add vite-plugin-combine
```

:::

## 使用方法

在 `vite.config.ts` 中引入并配置插件：

```typescript
import { defineConfig } from 'vite';
import pluginCombine from 'vite-plugin-combine';

export default defineConfig({
  plugins: [
    pluginCombine({
      src: 'src/*.ts', // 匹配要组合的文件路径
      target: 'src/index.ts', // 目标文件路径
      exports: 'named', // 导出类型：'named' | 'default' | ‘both’ ｜ 'none'
    })
  ],
  build: {
    minify: false,
    lib: {
      entry: [],
      formats: ['es', 'cjs'],
      fileName: '[name]'
    }
  }
});
```