# vite-plugin-view

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

## 多页面应用 (MPA) 示例

Vite 8 起支持通过 `entry` 对象配置多页面应用。以下示例使用 EJS 模板引擎配置两个页面：

**vite.config.js：**

```javascript
import { defineConfig } from 'vite';
import { view } from 'vite-plugin-view';

export default defineConfig({
  plugins: [
    view({
      engine: 'ejs',
      entry: {
        index: 'index.ejs',
        home: 'home.ejs'
      }
    })
  ],
  build: {
    // MPA + IIFE 输出必须开启代码分割，否则 Rolldown 抛出 INVALID_OPTION
    rolldownOptions: {
      output: {
        codeSplitting: true
      }
    }
  }
});
```

**index.ejs（首页模板）：**

```html
<!DOCTYPE html>
<html>
<head>
  <title>首页</title>
</head>
<body>
  <h1>欢迎来到首页</h1>
  <a href="/home.html">前往 Home 页</a>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

**home.ejs（Home 页模板）：**

```html
<!DOCTYPE html>
<html>
<head>
  <title>Home</title>
</head>
<body>
  <h1>Home 页面</h1>
  <a href="/index.html">返回首页</a>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

构建后会生成 `dist/index.html` 和 `dist/home.html` 两个独立的 HTML 文件。

> **注意**：当使用 MPA 且构建输出格式为 IIFE 时，必须设置 `build.rolldownOptions.output.codeSplitting: true`，否则 Rolldown（Vite 8 打包器）会抛出 `INVALID_OPTION` 错误。

---

## 注意事项
1. 确保已安装所选模板引擎的依赖包（如 `npm install pug`）
2. 模板文件需放置在 Vite 可识别的路径中（默认入口为 `index.${extension}`）
