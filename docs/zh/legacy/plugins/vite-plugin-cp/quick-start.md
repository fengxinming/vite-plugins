
::: danger 这是 Vite 1.x – 6.x 旧版文档归档 / This is Vite 1.x – 6.x legacy archive
- 本文档对应插件版本：**vite-plugin-view ≤ 4.x、vite-plugin-external ≤ 7.x、vite-plugin-build-chunk ≤ 4.x 等旧发行版**。
- 适用打包器：Rollup / esbuild（Vite 6 及之前的默认组合）。**不支持 Vite 8+ 的 Rolldown 打包器**，Vite 7/8+ 用户请立即返回新文档。
- 本目录内容已冻结，不再维护。遇到新功能/新字段请查看最新文档：
  - 中文新文档：<a href="/zh/plugins/">/zh/plugins/</a>
  - English new docs：<a href="/plugins/">/plugins/</a>
:::
# vite-plugin-cp（旧版）

[![npm package](https://nodei.co/npm/vite-plugin-cp.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/vite-plugin-cp)

> 一个用于复制文件/目录，并支持灵活转换文件内容、保留或扁平化目录结构、自定义文件重命名等的Vite插件。

[![NPM version](https://img.shields.io/npm/v/vite-plugin-cp.svg?style=flat)](https://npmjs.org/package/vite-plugin-cp)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-cp.svg?style=flat)](https://npmjs.org/package/vite-plugin-cp)
[![Node version](https://img.shields.io/node/v/vite-plugin-cp.svg?style=flat)](https://npmjs.org/package/vite-plugin-cp)


## 安装

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

## 功能特性
- 📁 支持使用glob模式复制文件/目录
- 🔄 在复制前灵活转换文件内容
- 📦 可保留或扁平化目录结构
- 🛠️ 自定义文件重命名
- 🔄 支持JavaScript和TypeScript项目
- ⚡ 在Vite的构建生命周期中运行

## 使用示例

```js
import { defineConfig } from 'vite';
import cp from 'vite-plugin-cp';

export default defineConfig({
  plugins: [
    cp({
      targets: [
        // 从 'node_modules/vite/dist' 复制所有文件到 'dist/cp/test'
        { src: './node_modules/vite/dist', dest: 'dist/cp/test', flatten: true },

        // 将 'node_modules/vite/dist' 的所有文件复制到 'dist/cp/test2'，保留目录结构
        { src: './node_modules/vite/dist', dest: 'dist/cp/test2' },

        // 将 'node_modules/vite' 的README.md文件复制到 'dist/cp'
        { src: './node_modules/vite/README.md', dest: 'dist/cp' },

        // 重命名复制文件
        { src: './node_modules/vite/index.cjs', dest: 'dist/cp', rename: 'index.js' },

        // 复制所有.ts文件到目标目录
        { src: './node_modules/vite/**/*.ts', dest: 'dist/cp/types' },

        // 动态重命名.ts文件
        {
          src: './node_modules/vite/**/*.ts', dest: 'dist/cp/types2', 
          rename(name) {
            return name.replace('.d.ts', '.ts');
          }
        },

        // 转换JSON文件内容
        {
          src: './node_modules/vite/package.json', dest: 'dist/cp', 
          transform(buf) {
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