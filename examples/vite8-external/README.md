# vite8-external

演示 `vite-plugin-external`：将依赖标记为外部，不打包进产物。

## 示例

| 配置 | 说明 |
|------|------|
| `vite.config.1.mts` | 基础 externals 映射（Record 形态） |
| `vite.config.2.mts` | 函数形态 externals，动态判断 |
| `vite.config.3.mts` | externalizeDeps 纯 external 不生成 shim（dev 靠 `engineOptions.importMap` 在页面补 `<script type="importmap">` 取 CDN） |
| `vite.config.4.mts` | 配置函数按 `command` 分支：dev=unpkg / build=linkdesign CDN（均 React 16.12） |
| `vite.config.5.mts` | `interop: 'auto'` — 修 IIFE 构建的 require 包装 |
| `vite.config.6.mts` | Vue 里写 JSX（`@vitejs/plugin-vue-jsx`）+ vue 外置 |
| `vite.config.7.mts` | CDN URL 形态 externals — ESM 模块预取 |
| `vite.config.8.mts` | nodeBuiltins + externalizeDeps — Node 库构建 |
| `vite.config.9.mts` | Vue 框架外置（SFC，`@vitejs/plugin-vue`） |
| `vite.config.10.mts` | 字符串/正则数组形态 externals |
| `vite.config.11.mts` | 自定义 cacheDir — 指定 stash 文件存放目录 |
| `vite.config.12.mts` | 按模式覆盖 externalizeDeps + nodeBuiltins |
| `vite.config.13.mts` | `lib.formats ['umd']` — UMD 同样走原生 external + output.globals |
| `vite.config.14.mts` | 纯 external（externals 函数返回 true）— 覆盖 dev 预打包转换 |
| `vite.config.15.mts` | 别的插件注入 `optimizeDeps.include` — externals 仍然优先 |
| `vite.config.16.mts` | `importmap: true` — CDN 形态 externals 拼成 `<script type="importmap">`，产物留裸 import |

含页面的示例（1/2/3/4/5/6/7/9/11/13/14/15/16）用 `vite-plugin-view` 渲染根目录的 `index.pug`：
`engineOptions.cdnScripts` 逐个挂 `<script crossorigin>`，`engineOptions.importMap` 挂
`<script type="importmap">`（3/16），`engineOptions.entry` 指定页面入口，模板本身不做任何判定。
**external 的依赖必须由页面提供**，页面没给出对应来源的示例在浏览器里跑不起来。

## 运行

```bash
pnpm dev:1      # 起 dev server（端口见 package.json 的 dev:<n> 脚本）
pnpm build:1    # 构建到 dist/1
```
