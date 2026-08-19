
::: danger 这是 Vite 1.x – 6.x 旧版文档归档 / This is Vite 1.x – 6.x legacy archive
- 本文档对应插件版本：**vite-plugin-view ≤ 4.x、vite-plugin-external ≤ 7.x、vite-plugin-build-chunk ≤ 4.x 等旧发行版**。
- 适用打包器：Rollup / esbuild（Vite 6 及之前的默认组合）。**不支持 Vite 8+ 的 Rolldown 打包器**，Vite 7/8+ 用户请立即返回新文档。
- 本目录内容已冻结，不再维护。遇到新功能/新字段请查看最新文档：
  - 中文新文档：<a href="/zh/plugins/">/zh/plugins/</a>
  - English new docs：<a href="/plugins/">/plugins/</a>
:::
# 使用示例（旧版）

假设你有以下文件结构：

```
src/
  |- index.js
```

配置如下：

```typescript
import { defineConfig } from 'vite';
import vitePluginHookUse from 'vite-plugin-hook-use';

export default defineConfig({
  plugins: [
    vitePluginHookUse()
  ]
});
```

```bash
vite build
```

将会在控制台打印出以下内容，数字表示调用次数

```bash
┌   === Start === 
│
◇  config(1)
│
◇  configResolved(1)
│
◇  options(1)
│
◇  buildStart(1)
│
◇  load(1)
│
◇  transform(1)
│
◇  moduleParsed(1)
│
◇  buildEnd(1)
│
◇  outputOptions(1)
│
◇  renderStart(1)
│
◇  banner(1)
│
◇  footer(1)
│
◇  intro(1)
│
◇  outro(1)
│
◇  renderChunk(1)
│
◇  generateBundle(1)
│
◇  writeBundle(1)
│
◇  closeBundle(1)
│
└   === End === 
```
