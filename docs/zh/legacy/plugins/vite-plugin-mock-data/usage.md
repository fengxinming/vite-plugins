
::: danger 这是 Vite 1.x – 6.x 旧版文档归档 / This is Vite 1.x – 6.x legacy archive
- 本文档对应插件版本：**vite-plugin-view ≤ 4.x、vite-plugin-external ≤ 7.x、vite-plugin-build-chunk ≤ 4.x 等旧发行版**。
- 适用打包器：Rollup / esbuild（Vite 6 及之前的默认组合）。**不支持 Vite 8+ 的 Rolldown 打包器**，Vite 7/8+ 用户请立即返回新文档。
- 本目录内容已冻结，不再维护。遇到新功能/新字段请查看最新文档：
  - 中文新文档：<a href="/zh/plugins/">/zh/plugins/</a>
  - English new docs：<a href="/plugins/">/plugins/</a>
:::
# 使用示例（旧版）

## 指定目录将模拟路由添加到开发服务器

在 `vite.config.mjs` 中配置：
```js
import { defineConfig } from 'vite';
import mockData from 'vite-plugin-mock-data';

export default defineConfig({
  plugins: [
    mockData({
      routes: './mock'
    })
  ]
});
```

创建模拟路由文件 `mock/test.ts`：
```txt
.
├── mock
│   └── test.ts
```

模拟路由文件内容：
```js
module.exports = {
  '/hello': 'hello',
  '/hello2'(req, res) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
    res.end('hello2');
  },
  '/hello3': {
    handler(req, res) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html');
      res.end('hello3');
    }
  },
  '/json': {
    handler: { hello: 1 }
  },
  '/package.json': {
    file: './package.json'
  }
};
```

通过浏览器请求 `/package.json`：
```js
fetch('/package.json')
  .then(res => res.json())
  .then((json) => {
    console.log(json);
  });
```

---

## 直接添加模拟路由到开发服务器

在 `vite.config.mjs` 中直接配置：
```js
import { defineConfig } from 'vite';
import mockData from 'vite-plugin-mock-data';

export default defineConfig({
  plugins: [
    mockData({
      routes: {
        '/hello': 'hello',
        '/hello2'(req, res) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/html');
          res.end('hello2');
        },
        '/hello3': {
          handler(req, res) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/html');
            res.end('hello3');
          }
        },
        '/json': {
          handler: { hello: 1 }
        },
        '/package.json': {
          file: './package.json'
        }
      }
    })
  ]
});
```

通过浏览器请求 `/package.json`：
```js
fetch('/package.json')
  .then(res => res.json())
  .then((json) => {
    console.log(json);
  });
```