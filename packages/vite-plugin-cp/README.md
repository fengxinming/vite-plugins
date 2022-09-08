# vite-plugin-cp

[![npm package](https://nodei.co/npm/vite-plugin-cp.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/vite-plugin-cp)

> Copy files after building bundles.

[![NPM version](https://img.shields.io/npm/v/vite-plugin-cp.svg?style=flat)](https://npmjs.org/package/vite-plugin-cp)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-cp.svg?style=flat)](https://npmjs.org/package/vite-plugin-cp)

## Installation

```bash
npm install vite-plugin-cp --save-dev
```

## Usage

```js
import cp from 'vite-plugin-cp';

export default defineConfig({
  plugins: [
    cp({
      targets: [
        { src: '../../node_modules/three/build/three.min.js', dest: './dist' }
      ]
    })
  ]
});
```

```txt
.
├── dist
│   ├── three.min.js
```

## Examples

**[See demo](examples/demo-cp)**
