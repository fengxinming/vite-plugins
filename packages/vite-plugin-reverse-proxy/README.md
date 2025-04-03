# vite-plugin-reverse-proxy

[![npm package](https://nodei.co/npm/vite-plugin-reverse-proxy.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/vite-plugin-reverse-proxy)

> Makes the script to be served with the text/javascript MIME type instead of module MIME type. Vite >= 3.1

[![NPM version](https://img.shields.io/npm/v/vite-plugin-reverse-proxy.svg?style=flat)](https://npmjs.org/package/vite-plugin-reverse-proxy)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-reverse-proxy.svg?style=flat)](https://npmjs.org/package/vite-plugin-reverse-proxy)

Sometimes we have to redirect scripts on production environment to debug and solve problems, the plugin will transform the script to be served with the text/javascript MIME type to module MIME type.

## Installation

```bash
npm install vite-plugin-reverse-proxy --save-dev
```

## Options

* `targets` - The target script to be proxied.
* `preambleCode` - The preamble code to be injected before the main script.

## Usage

Define a proxy configuration on [XSwitch](https://chrome.google.com/webstore/detail/xswitch/idkjhjggpffolpidfkikidcokdkdaogg)

```json
{
  "proxy": [
    [
      "http(s)?://(.*)/xxx/assets/main.js",
      "http://localhost:3000/app.js"
    ]
  ]
}
```

Use 'vite-plugin-reverse-proxy' to define proxy rules for web development

```js
import { defineConfig } from 'vite';
import reverseProxy from 'vite-plugin-reverse-proxy';

export default defineConfig({
  plugins: [
    reverseProxy({
      targets: {
        '/app.js':'src/main.jsx'
      }
    }),
  ]
});
```

```html
<script src="/app.js"></script>
```
