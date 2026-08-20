# vite-plugin-view

[![npm package](https://nodei.co/npm/vite-plugin-view.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/vite-plugin-view)

> Dynamically render pages using custom template engines instead of the static `.html` entry file.

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

## Multi-page (MPA) example

Starting with Vite 8, you can configure multi-page applications using the object form of `entry`. Below is an example using the EJS template engine with two pages:

**vite.config.js:**

```javascript
import { defineConfig } from 'vite';
import { view } from 'vite-plugin-view';

export default defineConfig({
  plugins: [
    view({
      engine: 'ejs',
      entry: {
        index: 'index.ejs',
        home: 'home.ejs'
      }
    })
  ],
  build: {
    // MPA + IIFE output requires code splitting, otherwise Rolldown throws INVALID_OPTION
    rolldownOptions: {
      output: {
        codeSplitting: true
      }
    }
  }
});
```

**index.ejs (index page template):**

```html
<!DOCTYPE html>
<html>
<head>
  <title>Index</title>
</head>
<body>
  <h1>Welcome to the Index Page</h1>
  <a href="/home.html">Go to Home Page</a>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

**home.ejs (home page template):**

```html
<!DOCTYPE html>
<html>
<head>
  <title>Home</title>
</head>
<body>
  <h1>Home Page</h1>
  <a href="/index.html">Back to Index</a>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

After building, two separate HTML files will be generated: `dist/index.html` and `dist/home.html`.

> **Note**: When using MPA with IIFE output format, you must set `build.rolldownOptions.output.codeSplitting: true`, otherwise Rolldown (Vite 8's bundler) throws an `INVALID_OPTION` error.

---

## Important Notes
1. Ensure the selected template engine dependency is installed (e.g., `npm install pug`).
2. Place template files in Vite-accessible paths (default entry: `index.${extension}`).
3. Some engines (e.g., `pug`) may have specific requirements for beautification (`pretty` option).
4. Always test configurations with your chosen template engine.
