# vite-plugin-cp

[![npm package](https://nodei.co/npm/vite-plugin-cp.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/vite-plugin-cp)

[![NPM version](https://img.shields.io/npm/v/vite-plugin-cp.svg?style=flat)](https://npmjs.org/package/vite-plugin-cp)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-cp.svg?style=flat)](https://npmjs.org/package/vite-plugin-cp)

> 一个用于复制文件/目录，并支持灵活转换文件内容、保留或扁平化目录结构、自定义文件重命名等的Vite插件。

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
        { src: './node_modules/vite/dist', dest: 'dist/cp/test' },

        // 将 'node_modules/vite/dist' 的所有文件复制到 'dist/cp/test2'，保留目录结构
        { src: './node_modules/vite/dist', dest: 'dist/cp/test2', flatten: false },

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