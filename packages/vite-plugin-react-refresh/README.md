# vite-plugin-react-refresh

[![npm package](https://nodei.co/npm/vite-plugin-react-refresh.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/vite-plugin-react-refresh)

> Provide enhancements for [@vitejs/plugin-react-refresh](https://www.npmjs.com/package/@vitejs/plugin-react-refresh).

[![NPM version](https://img.shields.io/npm/v/vite-plugin-react-refresh.svg?style=flat)](https://npmjs.org/package/vite-plugin-react-refresh)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-react-refresh.svg?style=flat)](https://npmjs.org/package/vite-plugin-react-refresh)

### Installation

```bash
npm install vite-plugin-react-refresh --save-dev
```

## Usage

```js
import reactRefresh from 'vite-plugin-react-refresh';

export default defineConfig({
  plugins: [
    reactRefresh({
      transformPlugins: [
        'babel-plugin-jsx-advanced'
      ]
    })
  ]
});
```

## Examples

**[Demo](examples/demo)**