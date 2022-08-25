# vite-plugin-external

[![npm package](https://nodei.co/npm/vite-plugin-external.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/vite-plugin-external)

> The `vite-plugin-external` provides a way of excluding dependencies from the runtime code and output bundles.

[![NPM version](https://img.shields.io/npm/v/vite-plugin-external.svg?style=flat)](https://npmjs.org/package/vite-plugin-external)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-external.svg?style=flat)](https://npmjs.org/package/vite-plugin-external)

![image](https://user-images.githubusercontent.com/6262382/126889725-a5d276ad-913a-4498-8da1-2aa3fd1404ab.png)

## Installation

```bash
npm install vite-plugin-external --save-dev
```

## Usage

```js
import createExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    createExternal({
      externals: {
        react: 'React'
      }
    })
  ]
});
```

### Override externals by mode

```js
import createExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    createExternal({
      externals: {
        react: 'React'
      },
      development: {
        externals: {
          react: '$linkdesign.React'
        }
      }
    })
  ]
});
```

## Examples

**[Demo](examples/demo-external)**
