
::: danger 这是 Vite 1.x – 6.x 旧版文档归档 / This is Vite 1.x – 6.x legacy archive
- 本文档对应插件版本：**vite-plugin-view ≤ 4.x、vite-plugin-external ≤ 7.x、vite-plugin-build-chunk ≤ 4.x 等旧发行版**。
- 适用打包器：Rollup / esbuild（Vite 6 及之前的默认组合）。**不支持 Vite 8+ 的 Rolldown 打包器**，Vite 7/8+ 用户请立即返回新文档。
- 本目录内容已冻结，不再维护。遇到新功能/新字段请查看最新文档：
  - 中文新文档：<a href="/zh/plugins/">/zh/plugins/</a>
  - English new docs：<a href="/plugins/">/plugins/</a>
:::
# vite-plugin-view（旧版）

[![npm package](https://nodei.co/npm/vite-plugin-view.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/vite-plugin-view)

> 使用自定义模板引擎动态渲染页面，替代静态的 `.html` 入口文件。

[![NPM version](https://img.shields.io/npm/v/vite-plugin-view.svg?style=flat)](https://npmjs.org/package/vite-plugin-view)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-view.svg?style=flat)](https://npmjs.org/package/vite-plugin-view)
[![Node version](https://img.shields.io/node/v/vite-plugin-view.svg?style=flat)](https://npmjs.org/package/vite-plugin-view)

---

## 支持的模板引擎
支持以下 59 种模板引擎（按字母顺序排列）：

* arc-templates
* atpl
* bracket
* dot
* dust
* eco
* ejs
* ect
* haml
* haml-coffee
* hamlet
* handlebars
* hogan
* htmling
* jade
* jazz
* jqtpl
* just
* liquid
* liquor
* lodash
* marko
* mote
* mustache
* nunjucks
* plates
* pug
* qejs
* ractive
* razor
* react
* slm
* squirrelly
* swig
* teacup
* templayed
* toffee
* twig
* underscore
* vash
* velocityjs
* walrus
* whiskers

---

## 安装步骤

### 1. 安装插件及模板引擎

::: code-group
```bash [npm]
npm install vite-plugin-view <模板引擎名称>
```
```bash [pnpm]
pnpm add vite-plugin-view <模板引擎名称>
```
```bash [yarn]
yarn add vite-plugin-view <模板引擎名称>
```
:::

> 替换 `<模板引擎名称>` 为上方列表中的任意一种（如 `pug` 或 `ejs`）

---

## 配置示例
在 `vite.config.js` 中配置插件：

```javascript
import { defineConfig } from 'vite';
import { view } from 'vite-plugin-view';

export default defineConfig({
  plugins: [
    view({
      engine: 'pug',  // 必填：指定模板引擎
    })
  ]
});
```

---

## 功能增强
如需为模板引擎添加全局变量/过滤器，可参考以下方法：
👉 [Template Engine Instances](https://github.com/ladjs/consolidate?tab=readme-ov-file#template-engine-instances)

---

## 注意事项
1. 确保已安装所选模板引擎的依赖包（如 `npm install pug`）
2. 模板文件需放置在 Vite 可识别的路径中（默认入口为 `index.${extension}`）
