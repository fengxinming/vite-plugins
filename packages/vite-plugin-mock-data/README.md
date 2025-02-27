# vite-plugin-mock-data

[![npm package](https://nodei.co/npm/vite-plugin-mock-data.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/vite-plugin-mock-data)

> Provides a simple way to mock data. Vite >= 3.1

[![NPM version](https://img.shields.io/npm/v/vite-plugin-mock-data.svg?style=flat)](https://npmjs.org/package/vite-plugin-mock-data)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-mock-data.svg?style=flat)](https://npmjs.org/package/vite-plugin-mock-data)

## Installation

```bash
npm install vite-plugin-mock-data --save-dev
```

## Options

```ts
import { Config as SirvConfig, HTTPVersion, RouteOptions, Handler } from 'find-my-way';

export interface HandleRoute {
  file?: string;
  handler?: any | Handler<HTTPVersion.V1>;
  options?: RouteOptions;
  store?: any;
}

export interface RouteConfig {
  [route: string]: string | Handler<HTTPVersion.V1> | HandleRoute;
}

export interface Options {
  /**
   * The directory to serve files from.
   * @default `process.cwd()`
   */
  cwd?: string;

  /**
   * If `true`, these mock routes is matched after internal middlewares are installed.
   * @default `false`
   */
  isAfter?: boolean;

  /**
   * Specify the directory to define mock assets.
   */
  assets?: string;

  /**
   * Initial options of `find-my-way`. see more at https://github.com/delvedor/find-my-way#findmywayoptions
   */
  routerOptions?: SirvConfig<HTTPVersion.V1> | SirvConfig<HTTPVersion.V2>;

  /**
   * Initial list of mock routes that should be added to the dev server
   * or specify the directory to define mock routes that should be added to the dev server.
   */
  routes?: RouteConfig | Array<RouteConfig | string> | string;
}
```

* `cwd` - Default: `process.cwd()`.
* `isAfter` - If `true`, these mock routes is matched after internal middlewares are installed.
* `assets` - Specify the directory to define mock assets.
* `routerOptions` - [Initial options of `find-my-way`](https://github.com/delvedor/find-my-way#findmywayoptions)
* `routes`
  * `RouteConfig | Array<RouteConfig | string>` - Initial list of mock routes that should be added to the dev server.
  * `string` - Specify the directory to define mock routes that should be added to the dev server.

## Usage

### Specify the directory to define mock assets

```js
import { defineConfig } from 'vite';
import mockData from 'vite-plugin-mock-data';

export default defineConfig({
  plugins: [
    mockData({
      assets: './mockAssets'
    })
  ]
});
```

```txt
.
├── mockAssets
│   ├── test.zip
│   └── test.json
```

```js
fetch('/test.json')
  .then(res => res.json())
  .then((json) => {
    console.log(json);
  });
```

```html
<a class="download" href="./test.zip">Download</a>
```

### add mock routes to the dev server

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

### Specify the directory to add mock routes to the dev server

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

```txt
.
├── mock
│   └── test.js
```

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

```js
fetch('/package.json')
  .then(res => res.json())
  .then((json) => {
    console.log(json);
  });
```

## Examples

* [See vite3 demo](../../examples/vite3-demo)
* [See vite4 demo](../../examples/vite4-demo)
* [See vite5 demo](../../examples/vite5-demo)
* [See vite6 demo](../../examples/vite6-demo)