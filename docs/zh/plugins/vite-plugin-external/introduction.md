# vite-plugin-external

[![npm package](https://nodei.co/npm/vite-plugin-external.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/vite-plugin-external)

[![NPM version](https://img.shields.io/npm/v/vite-plugin-external.svg?style=flat)](https://npmjs.org/package/vite-plugin-external)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-external.svg?style=flat)](https://npmjs.org/package/vite-plugin-external)

> 从运行时代码和构建后的 bundles 中排除指定的模块依赖项。
> 使用范围 Vite >= 3.1。

## 说明

当 `command` 的值为 `'serve'` 时，插件将 `externals` 转换成 `alias` 配置，这样可以直接使用 Vite 的文件加载能力；当 `command` 的值为 `'build'` 时，插件将 `externals` 转换成 `rollupOptions` 配置,包含 `external` 和 `output.globals`。但是可以通过配置 `interop` 为 `'auto'`，统一将 `externals` 转换成 `alias` 配置，打包后的代码中会使用兼容代码导入外部依赖。

## 运行时流程

![image](https://user-images.githubusercontent.com/6262382/126889725-a5d276ad-913a-4498-8da1-2aa3fd1404ab.png)

```js
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    pluginExternal({
      externals: {
        jquery: '$',

        react: 'React',
        'react-dom/client': 'ReactDOM',

        vue: 'Vue'
      }
    })
  ]
});
```

## 变更记录

* 6.0.0
  * 新增字段 `externalGlobals` 修复 https://github.com/rollup/rollup/issues/3188

* 4.3.1
  * `externalizeDeps` 配置项支持传入正则表达式

* 4.3.0
  * 上一个版本的 `mode: false` 的逻辑改用 `interop: 'auto'` 代替
  * 新增字段 `nodeBuiltins` 和 `externalizeDeps` 配置项用于开发node模块后的打包处理
