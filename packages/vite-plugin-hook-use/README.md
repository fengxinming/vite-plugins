# vite-plugin-hook-use

[![npm package](https://nodei.co/npm/vite-plugin-hook-use.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/vite-plugin-hook-use)

> Displays the sequence and frequency of vite calling its hook functions. Vite >= 3.1

[![NPM version](https://img.shields.io/npm/v/vite-plugin-hook-use.svg?style=flat)](https://npmjs.org/package/vite-plugin-hook-use)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-hook-use.svg?style=flat)](https://npmjs.org/package/vite-plugin-hook-use)

## Installation

```bash
npm install vite-plugin-hook-use --save-dev
```

## Usage

```js
import { defineConfig } from 'vite';
import vitePluginHookUse from 'vite-plugin-hook-use';

export default defineConfig({
  plugins: [
    vitePluginHookUse()
  ]
});
```

## Examples

* [See vite3 demo](../../examples/vite3-hook-use)
* [See vite4 demo](../../examples/vite4-hook-use)
* [See vite5 demo](../../examples/vite5-hook-use)
