# vite-plugin-module-script

[![npm package](https://nodei.co/npm/vite-plugin-module-script.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/vite-plugin-module-script)

> A vite plugin for dynamic creating a module script tag.

[![NPM version](https://img.shields.io/npm/v/vite-plugin-module-script.svg?style=flat)](https://npmjs.org/package/vite-plugin-module-script)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-module-script.svg?style=flat)](https://npmjs.org/package/vite-plugin-module-script)

## Usage

```js
import moduleScript from 'vite-plugin-module-script';

export default defineConfig({
  plugins: [
    moduleScript({
      mapping: {
        '/app.js': '/src/index.jsx'
      }
    })
  ]
});
```

dynamic creating a module script tag about `/src/index.jsx`, when visiting `/app.js`