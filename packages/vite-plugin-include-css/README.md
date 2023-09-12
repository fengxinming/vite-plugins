# vite-plugin-include-css

[![npm package](https://nodei.co/npm/vite-plugin-include-css.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/vite-plugin-include-css)

> build css into individual js files instead of using css links.

[![NPM version](https://img.shields.io/npm/v/vite-plugin-include-css.svg?style=flat)](https://npmjs.org/package/vite-plugin-include-css)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-include-css.svg?style=flat)](https://npmjs.org/package/vite-plugin-include-css)

## Installation

```bash
npm install vite-plugin-include-css --save-dev
```

## Usage

```js
import includeCSS from 'vite-plugin-include-css';

export default defineConfig({
  plugins: [
    includeCSS()
  ],
  build: {
    cssCodeSplit: false,
    lib: {
      entry: './index.js',
      name: 'Foo',
      fileName: 'index'
    }
  }
});
```
