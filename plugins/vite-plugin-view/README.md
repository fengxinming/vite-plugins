# vite-plugin-view

[![npm package](https://nodei.co/npm/vite-plugin-view.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/vite-plugin-view)

[![NPM version](https://img.shields.io/npm/v/vite-plugin-view.svg?style=flat)](https://npmjs.org/package/vite-plugin-view)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-view.svg?style=flat)](https://npmjs.org/package/vite-plugin-view)
[![Node version](https://img.shields.io/node/v/vite-plugin-view.svg?style=flat)](https://npmjs.org/package/vite-plugin-view)

> Dynamically render pages using custom template engines instead of the static `.html` entry file.

---

## Documentation

For detailed usage instructions and API references, please visit the official documentation:

👉 [View Full Documentation](https://fengxinming.github.io/vite-plugins/plugins/vite-plugin-view/quick-start)

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

## Installation

```bash
npm i -D vite-plugin-view <template-engine-name>
```

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

## Contributing

We welcome contributions from the community! If you find a bug or want to suggest an improvement, feel free to open an issue or submit a pull request.

### How to Contribute
1. Fork the repository.
2. Create a new branch for your changes.
3. Submit a pull request with a clear description of your changes.

## License

This project is licensed under the [MIT License](LICENSE).
