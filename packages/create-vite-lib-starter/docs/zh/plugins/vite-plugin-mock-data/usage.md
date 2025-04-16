# 使用示例

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