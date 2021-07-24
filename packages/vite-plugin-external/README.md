# vite-plugin-external

[![npm package](https://nodei.co/npm/vite-plugin-external.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/vite-plugin-external)

> Better to define externals for vite. It not only work on our source code, but also work on pre-bundling dependencies well.

[![NPM version](https://img.shields.io/npm/v/vite-plugin-external.svg?style=flat)](https://npmjs.org/package/vite-plugin-external)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-external.svg?style=flat)](https://npmjs.org/package/vite-plugin-external)

## Usage

```js
import external from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    external({
      react: 'React'
    })
  ]
});
```
