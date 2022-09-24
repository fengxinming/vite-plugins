# vite-plugin-cp

[![npm package](https://nodei.co/npm/vite-plugin-cp.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/vite-plugin-cp)

> Copy files after building bundles.

[![NPM version](https://img.shields.io/npm/v/vite-plugin-cp.svg?style=flat)](https://npmjs.org/package/vite-plugin-cp)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-cp.svg?style=flat)](https://npmjs.org/package/vite-plugin-cp)

## Installation

```bash
npm install vite-plugin-cp --save-dev
```

## Options

* `hook` - Default `'writeBundle'`, vite hook the plugin should use.
* `targets` - Array of targets to copy.A target is an object with properties:

  * src (string Array): Path or glob of what to copy
  * dest (string Array): One or more destinations where to copy
  * rename (string Function): Change destination file or folder name
* `globbyOptions` - globby options[https://github.com/mrmlnc/fast-glob#options-3]

## Usage

```js
import cp from 'vite-plugin-cp';

export default defineConfig({
  plugins: [
    cp({
      targets: [
        { 
          src: '../../node_modules/three/build/three.min.js', dest: './dist'
        }
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
