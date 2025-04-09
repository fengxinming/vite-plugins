# vite-plugin-view

[![npm package](https://nodei.co/npm/vite-plugin-view.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/vite-plugin-view)

> Dynamically render pages using custom template engines instead of the static `index.html` entry file.

[![NPM version](https://img.shields.io/npm/v/vite-plugin-view.svg?style=flat)](https://npmjs.org/package/vite-plugin-view)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-view.svg?style=flat)](https://npmjs.org/package/vite-plugin-view)
[![Node version](https://img.shields.io/node/v/vite-plugin-view.svg?style=flat)](https://npmjs.org/package/vite-plugin-view)


---

## Supported Template Engines
The plugin supports **59 template engines** (sorted alphabetically):


* arc-templates
* atpl
* bracket
* dot
* dust
* eco
* ejs
* ect
* haml
* haml-coffee
* hamlet
* handlebars
* hogan
* htmling
* jade
* jazz
* jqtpl
* just
* liquid
* liquor
* lodash
* marko
* mote
* mustache
* nunjucks
* plates
* pug
* qejs
* ractive
* razor
* react
* slm
* squirrelly
* swig
* teacup
* templayed
* toffee
* twig
* underscore
* vash
* velocityjs
* walrus
* whiskers

---

## Installation Steps

### 1. Install Plugin & Template Engine
::: code-group
```bash [npm]
npm add vite-plugin-view <template-engine-name>
```
```bash [pnpm]
pnpm add vite-plugin-view <template-engine-name>
```
```bash [yarn]
yarn add vite-plugin-view <template-engine-name>
```
:::

> Replace `<template-engine-name>` with any engine from the list above (e.g., `pug` or `ejs`).

---

## Configuration Example
Configure the plugin in `vite.config.js`:

```javascript
import { defineConfig } from 'vite';
import { view } from 'vite-plugin-view';

export default defineConfig({
  plugins: [
    view({
      engine: 'pug',  // Set the template engine to use (e.g., 'pug', 'ejs', etc.)
    })
  ]
});
```

---

## Advanced Features
To add global variables/filters to template engines, refer to:
👉 [Template Engine Instances](https://github.com/ladjs/consolidate?tab=readme-ov-file#template-engine-instances)

---

## Important Notes
1. Ensure the selected template engine dependency is installed (e.g., `npm install pug`).
2. Place template files in Vite-accessible paths (default entry: `index.${extension}`).
3. Some engines (e.g., `pug`) may have specific requirements for beautification (`pretty` option).
4. Always test configurations with your chosen template engine.
```
