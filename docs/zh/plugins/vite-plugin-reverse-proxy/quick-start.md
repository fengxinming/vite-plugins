# vite-plugin-reverse-proxy

[![npm package](https://nodei.co/npm/vite-plugin-reverse-proxy.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/vite-plugin-reverse-proxy)

> 把脚本以 `text/javascript`（经典脚本 / non-module）MIME 类型对外提供，并为其注入 Vite Dev Server 所需的 `@vite/client` + HMR preamble bootloader。
>
> 典型使用场景：第三方站点（CMS、后台系统、Chrome 扩展 content script、老工程 iframe）以 `<script src="http://localhost:5173/app.js">` 的形式**不经 ESM 机制**直链你的 Vite 工程入口，但 Vite 默认只会提供 `type=module` 的脚本；本插件把这层代理做好，让非模块环境也能用上 Vite Dev Server 的 HMR。

[![NPM version](https://img.shields.io/npm/v/vite-plugin-reverse-proxy.svg?style=flat)](https://npmjs.org/package/vite-plugin-reverse-proxy)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-reverse-proxy.svg?style=flat)](https://npmjs.org/package/vite-plugin-reverse-proxy)
[![Node version](https://img.shields.io/node/v/vite-plugin-reverse-proxy.svg?style=flat)](https://npmjs.org/package/vite-plugin-reverse-proxy)

## 工作原理 / How it works

当请求命中 `targets` 里声明的对外路径（例如 `/app.js`）时：

1. 插件返回一段**经典脚本**（不是 module）：
   - 在 `<head>` 最前面注入 `<script id="clientCode" type="module" src="/@vite/client">`（HMR / 错误覆盖客户端）
   - 如果配了 `preambleCode`，再额外插入一个 `<script id="preambleCode">`（在 client 之前执行，用来加载 polyfill、注入 `__BASE__`、做全局 bridge 初始化等）
   - 最后创建 `mainScript.type='module' src='你的真实入口 src/main.jsx'` 挂到 `<body>` 末尾执行
2. 因为 `@vite/client` 是以标准 module 方式加载的，HMR 链路正常；外层 `app.js` 返回的只是这个 bootloader **装配器**，任何能执行普通 JS 的 `<script>` 都能消费它。

::: warning 仅开发时生效 / Dev only
- `configResolved.isProduction === true`（构建）时 `load` 直接 `return`，**插件对生产构建 0 影响**——你该按 ESM/UMD/IIFE 正常打什么包就打什么包。
- Dev server 通常默认绑定 `::`（IPv6 loopback），如果第三方页面在 `127.0.0.1` 上访问，请在 `vite.config.server.host` 强制 `'127.0.0.1'` 避免跨协议不可达。
:::

## Installation

::: code-group

```bash [npm]
npm add vite-plugin-reverse-proxy -D
```

```bash [pnpm]
pnpm add vite-plugin-reverse-proxy -D
```

```bash [yarn]
yarn add vite-plugin-reverse-proxy -D
```

:::

## Usage

### 基础示例：对外暴露 `/app.js` 代理到 `src/main.jsx`

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import reverseProxy from 'vite-plugin-reverse-proxy';

export default defineConfig({
  plugins: [
    react(),
    reverseProxy({
      targets: {
        // key   = 第三方页面实际引用的对外 URL（带前导 /）
        // value = Vite 工程里的真实入口模块相对路径（相对于 project root）
        '/app.js': 'src/main.jsx',
      },
    }),
  ],
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
});
```

现在任何第三方站点只需这样嵌入即可获得**带 HMR 的 Vite 入口**：

```html
<!-- 另一个域 / 老工程页面 / CMS 模板里 -->
<script src="http://127.0.0.1:5173/app.js"></script>
```

### 多入口：同时代理多个对外脚本

```ts
reverseProxy({
  targets: {
    '/widget/a.js': 'src/widgets/a.ts',
    '/widget/b.js': 'src/widgets/b.tsx',
    '/admin.js':   'src/entries/admin.tsx',
  },
}),
```

### 注入 preamble 前置脚本（polyfill / global bridge）

`preambleCode` 会在真实的 main entry 执行之前、client script 之后注入：

```ts
reverseProxy({
  targets: {
    '/embed.js': 'src/embed.ts',
  },
  // 例如：老工程的全局 jQuery 里我们挂载了 window.__HOST__ ，
  // 提前把它读出来赋给 import.meta.env 风格的全局，避免模块里取不到
  preambleCode: `
    window.__EMBED_ENV__ = {
      host: window.__HOST__ || location.origin,
      version: '1.0.0',
    };
  `,
}),
```

## Options

| 字段 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `targets` | `Record<string, string>` | — 必填 | 对外路径 → 工程内入口模块的映射。key 必须以 `/` 开头（会和 `load(id)` 传入的 id 对比，去掉 query/hash 之后再匹配）；value 是相对于 Vite project root 的真实入口文件路径。 |
| `preambleCode?` | `string` | `undefined` | 在 main 模块**之前**以 `type=module` 插入的自定义脚本。典型用途：polyfill、全局 bridge、环境变量预注入、路由初始化钩子。支持 `__BASE__` 占位符，会在注入时替换成配置的 `base`。 |

## 与 Vite 8 / Rolldown 的兼容性

- 本插件**只在 dev 阶段做事**，不参与任何构建，因此与 Vite 8 引入的 Rolldown 完全无冲突——不管未来打包器怎么换，dev server 提供的 `/@vite/client` + module script 形态是稳定的，bootloader 照常工作。
- `targets` 中使用的真实入口仍会被 Vite dev 管线正常经过 `@vitejs/plugin-react`、ts 转换、HMR accept，没有副作用。

## 与 examples/vite8-reverse-proxy 对应

仓库里 `examples/vite8-reverse-proxy/test/dev.test.ts` 端到端验证了：

1. `fetch('GET /app.js')` 返回状态 200 + `Content-Type: application/javascript`
2. 响应体包含 `<script type="module" src="/@vite/client">` 的装配逻辑
3. 响应体包含 `preambleCode` 注入分支
4. `mainScript.src = '/src/main.ts'`（真实入口）的拼接正确
