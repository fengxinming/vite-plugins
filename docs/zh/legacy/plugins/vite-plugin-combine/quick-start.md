
::: danger 这是 Vite 1.x – 6.x 旧版文档归档 / This is Vite 1.x – 6.x legacy archive
- 本文档对应插件版本：**vite-plugin-view ≤ 4.x、vite-plugin-external ≤ 7.x、vite-plugin-build-chunk ≤ 4.x 等旧发行版**。
- 适用打包器：Rollup / esbuild（Vite 6 及之前的默认组合）。**不支持 Vite 8+ 的 Rolldown 打包器**，Vite 7/8+ 用户请立即返回新文档。
- 本目录内容已冻结，不再维护。遇到新功能/新字段请查看最新文档：
  - 中文新文档：<a href="/zh/plugins/">/zh/plugins/</a>
  - English new docs：<a href="/plugins/">/plugins/</a>
:::
# vite-plugin-combine（旧版）

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