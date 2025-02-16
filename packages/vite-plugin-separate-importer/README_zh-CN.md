# vite-plugin-separate-importer

[![npm package](https://nodei.co/npm/vite-plugin-separate-importer.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/vite-plugin-separate-importer)

> 将导入语句从代码中分离。适用于 Vite >= 3.1

[![NPM version](https://img.shields.io/npm/v/vite-plugin-separate-importer.svg?style=flat)](https://npmjs.org/package/vite-plugin-separate-importer)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-separate-importer.svg?style=flat)](https://npmjs.org/package/vite-plugin-separate-importer)

## [English](README.md) | 中文

## 安装

使用 npm 安装插件：

```bash
npm install vite-plugin-separate-importer --save-dev
```

或者使用 yarn：

```bash
yarn add vite-plugin-separate-importer --dev
```

## 使用方法

在你的 Vite 配置文件（如 `vite.config.ts` 或 `vite.config.js`）中引入并配置插件：

### TypeScript 示例

```typescript
import { defineConfig } from 'vite';
import ts from '@rollup/plugin-typescript';
import createExternal from 'vite-plugin-external';
import separateImporter from 'vite-plugin-separate-importer';
import decamelize from 'decamelize';

export default defineConfig({
  plugins: [
    createExternal({
      externalizeDeps: ['vue', 'vant']
    }),
    ts({
      compilerOptions: {
        declarationDir: 'dist/separate-importer'
      }
    }),
    separateImporter({
      libs: [
        {
          name: 'vant',
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
    outDir: 'dist/separate-importer',
    minify: false,
    lib: {
      formats: ['es', 'cjs'],
      entry: ['src/separate-importer.ts'],
      fileName(format, entryName) {
        return entryName + (format === 'es' ? '.mjs' : '.js');
      }
    }
  }
});
```

### JavaScript 示例

```javascript
import { defineConfig } from 'vite';
import ts from '@rollup/plugin-typescript';
import createExternal from 'vite-plugin-external';
import separateImporter from 'vite-plugin-separate-importer';
import decamelize from 'decamelize';

export default defineConfig({
  plugins: [
    createExternal({
      externalizeDeps: ['vue', 'vant']
    }),
    ts({
      compilerOptions: {
        declarationDir: 'dist/separate-importer'
      }
    }),
    separateImporter({
      libs: [
        {
          name: 'vant',
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
    outDir: 'dist/separate-importer',
    minify: false,
    lib: {
      formats: ['es', 'cjs'],
      entry: ['src/separate-importer.ts'],
      fileName(format, entryName) {
        return entryName + (format === 'es' ? '.mjs' : '.js');
      }
    }
  }
});
```

## 选项

```ts
export interface ImportSource {
  es: string;
  cjs?: string;
}

export interface libConfig {
  /**
   * 待转换的库名称，可以是单个字符串或字符串数组
   * Library name(s) to be transformed, can be a single string or an array of strings
   */
  name: string | string[];
  /**
   * 模块的新路径
   * New path for the module
   */
  importerSource?: (importer: string, libName: string) => string | ImportSource;
  /**
   * 插入导入声明
   * Insert import source
   */
  insertImport?: (importer: string, libName: string) => string | Array<string | ImportSource>;
}

export interface Options {
 /**
 * 插件配置接口，用于定义待转换的库名称及其处理逻辑
 * Interface for plugin configuration to define the library names and processing logic
 */
 libs?: libConfig[];
}
```

## 示例

- [Vite 3 示例](../../examples/vite3-demo)
- [Vite 4 示例](../../examples/vite4-demo)
- [Vite 5 示例](../../examples/vite5-demo)
- [Vite 6 示例](../../examples/vite6-demo)
