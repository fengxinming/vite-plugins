
::: danger This is Vite 1.x – 6.x LEGACY documentation archive / 这是 Vite 1.x – 6.x 旧版文档归档
- These pages correspond to old plugin releases: **vite-plugin-view ≤ 4.x, vite-plugin-external ≤ 7.x, vite-plugin-build-chunk ≤ 4.x, etc.**
- Bundler covered: Rollup + esbuild (the default Vite 6 and below stack). **This does NOT apply to Vite 8+ with the new Rolldown bundler**; Vite 7/8+ users, go to the current docs immediately.
- Content under this folder is frozen and unmaintained. For any new option / field, check the current docs:
  - Latest English docs: [/guide/introduction](/guide/introduction)
  - 最新中文文档：[/zh/guide/introduction](/zh/guide/introduction)
:::
# Usage Examples (legacy)

## Specify the directory to add mock routes to the dev server

`vite.config.mjs`
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

Make a mock route file `mock/test.ts`
```txt
.
├── mock
│   └── test.ts
```

The mock route file:
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

Make a request to `/package.json` from the browser
```js
fetch('/package.json')
  .then(res => res.json())
  .then((json) => {
    console.log(json);
  });
```

## add mock routes to the dev server

`vite.config.mjs`

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

```js
fetch('/package.json')
  .then(res => res.json())
  .then((json) => {
    console.log(json);
  });
```

