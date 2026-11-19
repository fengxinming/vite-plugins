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

1. **开发阶段（预打包 DepsOptimizer）**：给 Rolldown 注入一个自定义插件，把命名外部依赖（`react → React` 这种带全局名的）解析到插件生成的 stash 文件，避免裸引用残留；纯外部（string/正则/`true`/函数返回 true）不进入预打包，保留为裸说明符。
2. **开发阶段（浏览器请求时）**：在 Vite 中间件层走正常的 resolveId 流程。
3. **构建阶段**：实际产出格式是 `iife`/`umd` 时，external 挂到 `build.rolldownOptions.external` + `output.globals`；`es`/`cjs` 输出由 build 的 config 钩子声明式覆盖 `build.rolldownOptions.external` 为恒 false 函数（不在用户对象上就地清空），命名 external 统一走 stash shim 打包。实际格式列表复刻 Vite 的 `resolveBuildOutputs`，因此 `build.lib.formats` 同样参与判断。ES CDN 形态另由 `transformIndexHtml` 按 CDN 模块逐条注入 `<link rel="modulepreload">` —— **仅 build**，dev 的 HTML 永远不带这些标签。开启 `importmap: true` 后 build 的解析目标改为裸说明符：产物保留裸 import，`transformIndexHtml` 注入 `<script type="importmap">{"imports": …}</script>` 并为每个 URL 配一条 `<link rel="modulepreload" crossorigin>`。这种模式下 stash 文件仍然照写（dev 预打包和标签名单都依赖它），开关只改 build 的解析目标与 HTML 内容。

> Vite 6 及以前（alias + rolldownOptions 两套实现 + `interop` 兼容开关 + `rollback: true` 回退）的内容已经归档。需要查阅历史实现请到 [旧文档：Vite 1-6 external 归档](/zh/legacy/plugins/vite-plugin-external/quick-start)。

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

## 前提：先在 `index.html` 里提供全局变量

全局变量形态的 externals（如 `react: 'React'`）只有在运行时全局变量真实存在才有效——本插件只是把 import 重写成全局变量查找，**不会**帮你下载任何脚本。请先在 `index.html` 里引入 UMD 构建，并保证 `window` 上的变量名与 `externals` 的值一致：

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>demo</title>
  <!-- CDN UMD 构建提供 window.React / window.ReactDOM -->
  <script crossorigin src="https://unpkg.com/umd-react/dist/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/umd-react/dist/react-dom.production.min.js"></script>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/index.tsx"></script>
</body>
</html>
```

ESM CDN 形态是例外——无需手动加脚本：build 产物直接 import 绝对 CDN 地址，插件还会注入 `<link rel="modulepreload">`。开启 `importmap: true`（见 [使用示例 → 用导入映射替代 CDN 地址](/zh/plugins/vite-plugin-external/usage#用导入映射替代-cdn-地址)）后地址不再写进产物，改由插件注入的 `<script type="importmap">` 提供。

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
        react: 'https://esm.sh/react@19.3.1',
        'react-dom/client': 'https://esm.sh/react-dom@19.3.1/client',
      },
    }),
  ],
});
```

## Q&A

* 问: 开发时修改 `externals` 后页面无法加载？
* 答: 本插件会把命名 external 的 stash 文件缓存到 `./node_modules/.vite_external`，修改配置后删除该目录让缓存重建即可（它和 Vite 自己的 `.vite` 目录放在一起，一键清理可以 `rm -rf node_modules/.vite*`）。

## 历史变更记录
* **8.1.0**
  * 新增 `ExternalEsConfig`（`{ format: 'es', url, exports? }`）作为 `externals` 的值形态。`exports` 可选 `'auto'`（默认）/ `'named'` / `'default'` / `'none'`，决定生成的再导出 shim；未知取值或缺少 `url` 会在写 stash 时直接抛错。
  * build 阶段的 external 门控现在复刻 Vite 的 `resolveBuildOutputs`：`build.lib.formats` 与 `build.rolldownOptions.output` 一起参与判断，只声明 `formats: ['iife' | 'umd']` 的 lib 构建也能保留原生 external + `output.globals`。
  * `apply` / `enforce` 在插件工厂阶段读取并给默认值（`apply` 默认排除 preview；`enforce` 默认 `'post'`，作用于 config 插件，解析插件固定 `'pre'`）；它们是插件级字段，不能按模式覆盖。
  * `externalizeDeps` 在 dev 与 build 都生效；命中的依赖在 dev 下变成裸 `/@id/<说明符>` 请求，页面需要以该前缀为键的导入映射表才取到模块，这张表由你自己提供——插件只在 build 且 `importmap: true` 时注入映射（见 [使用示例 → 用导入映射替代 CDN 地址](/zh/plugins/vite-plugin-external/usage#用导入映射替代-cdn-地址)）。
  * 新增 `importmap: true`：**build 阶段** CDN 形态的 `externals` 保留裸 import，地址改为注入 `<script type="importmap">` 与每个 URL 一条 `<link rel="modulepreload" crossorigin>`；stash 文件仍然照写，dev 的解析与 HTML 不受影响。
  * dev 下 Vite 预构建的依赖同样受 `externals` 管辖，包括被其他插件写进 `optimizeDeps.include` 的那些：`externals` 优先，dev 与 build 判定一致，用户不必再手工维护 `optimizeDeps.include`。
  * 纯 external（`externals` 返回 `true`）在 dev 下生效：依赖不再被预打包进 `deps/<name>.js`。
  * dev 下也能外置 CSS 与资源类 id（`*.module.css`、普通 CSS、`.wasm`、图片、SFC 类请求）；此前只判定裸包名。
  * 修复：external 的 id 在产物写出前被二次解析成真实 `node_modules` 路径，导致裸 import / CDN 地址丢失；现在把 id 标记为已最终化。
  * 修复：改 `vite.config` 重启后，CDN 形态的 external 丢掉 `<link rel="modulepreload">` 标签；build 的标签名单改从内存 stash 取，不再依赖恢复缓存文件。
  * 修复：dev 的缓存清理原本是异步钩子，会和 DepsOptimizer 竞态复用脏条目；现改为同步，并对依赖名单去重。
  * stash 元数据（`_metadata.json`）收敛为唯一的防抖写入路径，并在 dev 服务关闭时强制落盘；移除了重启恢复流程。
  * 缓存文件名在 Windows 上安全且不再撞名（`vp-runtime-helper@8.0.1` 重做了 `flattenId`）。
  * 新增依赖 `@rolldown/pluginutils`。

* **8.0.3**
  * 在指定模式下，支持多覆盖两个配置属性`'nodeBuiltins'`和`'externalizeDeps'`

* **8.0.2**
  * 在 package.json 中添加 `"type": "module"`

* **8.0.1**
  * 删除旧版 `rollback` 配置，修改文档

* **8.0.0**
  * 本版本（Vite 8 兼容版）是在 v6.2.2 代码基础上针对 Rolldown + DepsOptimizer 做的完整重写。
