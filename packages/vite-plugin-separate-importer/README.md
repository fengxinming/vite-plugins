# vite-plugin-separate-importer

[![npm package](https://nodei.co/npm/vite-plugin-separate-importer.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/vite-plugin-separate-importer)

> Transform bulk imports from a single source module into individual file imports from the source module (Vite >= 3.1)

[![NPM version](https://img.shields.io/npm/v/vite-plugin-separate-importer.svg?style=flat)](https://npmjs.org/package/vite-plugin-separate-importer)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-separate-importer.svg?style=flat)](https://npmjs.org/package/vite-plugin-separate-importer)

## [中文](README_zh-CN.md) | English

## Installation

Install the plugin using npm:

```bash
npm install vite-plugin-separate-importer --save-dev
```

Or using yarn:

```bash
yarn add vite-plugin-separate-importer --dev
```

## Usage

Import and configure the plugin in your Vite configuration file (e.g., `vite.config.ts` or `vite.config.js`):

### Configuration Example

```typescript
import { defineConfig } from 'vite';
import ts from '@rollup/plugin-typescript';
import pluginExternal from 'vite-plugin-external';
import pluginSeparateImporter from 'vite-plugin-separate-importer';
import decamelize from 'decamelize';

export default defineConfig({
  plugins: [
    pluginExternal({
      externalizeDeps: ['antd']
    }),
    ts(),
    pluginSeparateImporter({
      libs: [
        {
          name: 'antd',
          importerSource(importer, libName) {
            return {
              es: `${libName}/es/${decamelize(importer)}`,
              cjs: `${libName}/lib/${decamelize(importer)}`
            };
          },
          insertImport(importer, libName) {
            return {
              es: `${libName}/es/${decamelize(importer)}/style`,
              cjs: `${libName}/lib/${decamelize(importer)}/style`
            };
          }
        }
      ]
    })
  ],
  build: {
    minify: false,
    lib: {
      formats: ['es', 'cjs'],
      entry: ['src/*.tsx'],
      fileName(format, entryName) {
        return entryName + (format === 'es' ? '.mjs' : '.js');
      }
    }
  }
});
```

### Wrapped Component Example
```tsx
import { Button } from 'antd';

export function WrappedButton() {
  return <Button>Wrapped Button</Button>;
}
```

### Compiled Output
```js
import Button from "antd/es/button";
import "antd/es/button/style";
function WrappedButton() {
  return /* @__PURE__ */ React.createElement(Button, null, "Wrapped Button");
}
export {
  WrappedButton
};
```

## Options

```ts
export interface ImportSource {
  es: string;
  cjs?: string;
}

export interface LibConfig {
  /**
   * Library name(s) to be transformed, can be a single string or an array of strings
   */
  name: string | string[];
  /**
   * New path for the module
   */
  importerSource?: (importer: string, libName: string) => string | ImportSource;
  /**
   * Insert import source
   */
  insertImport?: (importer: string, libName: string) => string | Array<string | ImportSource>;
}

export interface Options {
  /**
   * The value of enforce can be either `"pre"` or `"post"`, see more at https://vitejs.dev/guide/api-plugin.html#plugin-ordering.
   *
   * Enforce execution order, `pre` before, `post` after, reference https://vitejs.dev/guide/api-plugin.html#plugin-ordering.
   */
  enforce?: 'pre' | 'post';

  /**
   * Interface for plugin configuration to define the library names and processing logic
   */
  libs?: LibConfig[];
}
```

## Examples

- [Vite 3 Example](../../examples/vite3-demo)
- [Vite 4 Example](../../examples/vite4-demo)
- [Vite 5 Example](../../examples/vite5-demo)
- [Vite 6 Example](../../examples/vite6-demo)