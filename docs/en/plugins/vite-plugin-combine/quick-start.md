# vite-plugin-combine

[![npm package](https://nodei.co/npm/vite-plugin-combine.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/vite-plugin-combine)

[![NPM version](https://img.shields.io/npm/v/vite-plugin-combine.svg?style=flat)](https://npmjs.org/package/vite-plugin-combine)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-combine.svg?style=flat)](https://npmjs.org/package/vite-plugin-combine)

> Combines multiple module files into a single target file. It supports four modes: named exports, default exports, automatic exports, and no exports, and can auto-generate corresponding import statements based on configuration.

## Installation

::: code-group

```bash [npm]
npm add vite-plugin-combine
```
```bash [pnpm]
pnpm add vite-plugin-combine
```
```bash [yarn]
yarn add vite-plugin-combine
```

:::

## Usage

Import and configure the plugin in `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import pluginCombine from 'vite-plugin-combine';

export default defineConfig({
  plugins: [
    pluginCombine({
      src: 'src/*.ts', // Match files to combine
      target: 'src/index.ts', // Target file path
      exports: 'named', // Export type: 'named' | 'default' | 'both' | 'none'
    })
  ],
  build: {
    minify: false,
    lib: {
      formats: ['es', 'cjs'],
      fileName: '[name]'
    }
  }
});
```