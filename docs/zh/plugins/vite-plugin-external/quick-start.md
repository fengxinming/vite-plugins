# vite-plugin-external

[![npm package](https://nodei.co/npm/vite-plugin-external.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/vite-plugin-external)

> 从运行时代码和构建后的 bundles 中排除指定的模块依赖项。
> 使用范围：Vite 8.x（当前重写版本，兼容 Rolldown 打包器）。Vite 1-6 用户请参阅旧文档归档。

[![NPM version](https://img.shields.io/npm/v/vite-plugin-external.svg?style=flat)](https://npmjs.org/package/vite-plugin-external)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-external.svg?style=flat)](https://npmjs.org/package/vite-plugin-external)
[![Node version](https://img.shields.io/node/v/vite-plugin-external.svg?style=flat)](https://npmjs.org/package/vite-plugin-external)

## 说明

### 当前 Vite 8 版本的实现方式（Rolldown）

当前版本针对 Vite 8 + Rolldown 重写了整个外部依赖处理管线。无论开发（serve）还是构建（build），所有形态的 `externals`（对象、函数、字符串、正则、数组、`true`）都会先被归一化成同签名的 decision hook（详见 [配置项参考：ExternalFn 类型](/zh/plugins/vite-plugin-external/options#externalfn-类型)），然后在三处入口共享完全相同的决策逻辑：

1. **开发阶段（预打包 DepsOptimizer）**：给 Rolldown 注入一个自定义插件，把命名外部依赖（`react → React` 这种带全局名的）解析到插件生成的 stash 文件，避免裸引用残留；纯外部（string/正则/`true`/函数返回 true）直接标 external。
2. **开发阶段（浏览器请求时）**：在 Vite 中间件层走正常的 resolveId 流程。
3. **构建阶段**：统一把 external 挂到 `build.rolldownOptions.external`；对于 ES CDN 形态在 `transformIndexHtml` 里注入 `<link rel="modulepreload">`。

> Vite 6 及以前（alias + rollupOptions 两套实现 + `interop` 兼容开关 + `rollback: true` 回退）的内容已经归档。需要查阅历史实现请到 [旧文档：Vite 1-6 external 归档](/zh/legacy/plugins/vite-plugin-external/quick-start)。

## 安装

::: code-group

```bash [npm]
npm add vite-plugin-external
```
```bash [pnpm]
pnpm add vite-plugin-external
```
```bash [yarn]
yarn add vite-plugin-external
```

:::

**iife 格式打包（全局变量注入 HTML script 标签）**

```js
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    pluginExternal({
      externals: {
        jquery: '$',
        vue: 'Vue',
        react: 'React',
        'react-dom/client': 'ReactDOM',
      },
    }),
  ],
  build: {
    rolldownOptions: {
      output: {
        format: 'iife',
      },
    },
  },
});
```

**动态配置 externals（函数形态）**

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    react({ jsxRuntime: 'classic' }),
    pluginExternal({
      externals(libName) {
        if (libName === 'react') return 'React';
        if (libName === 'react-dom/client') return 'ReactDOM';
      },
    }),
  ],
  build: {
    rolldownOptions: {
      output: {
        format: 'iife',
      },
    },
  },
});
```

**esm 格式打包（从绝对 ESM CDN URL 重导出）**

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    react({ jsxRuntime: 'classic' }),
    pluginExternal({
      externals: {
        react: 'https://esm.sh/react@18.3.1',
        'react-dom/client': 'https://esm.sh/react-dom@18.3.1',
      },
    }),
  ],
});
```

## Q&A

* 问: 开发时修改 `externals` 后页面无法加载？
* 答: 本插件会把命名 external 的 stash 文件缓存到 `./node_modules/.vite_external`，修改配置后删除该目录让缓存重建即可（它和 Vite 自己的 `.vite` 目录放在一起，一键清理可以 `rm -rf node_modules/.vite*`）。

## 历史变更记录

* **8.0.2**
  * 在 package.json 中添加 `"type": "module"`

* **8.0.1**
  * 删除旧版 `rollback` 配置，修改文档

* **8.0.0**
  * 本版本（Vite 8 兼容版）是在 v6.2.2 代码基础上针对 Rolldown + DepsOptimizer 做的完整重写。
