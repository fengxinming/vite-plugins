# Usage Examples

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

