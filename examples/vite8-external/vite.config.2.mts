import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import buildChunk from 'vite-plugin-build-chunk';
import pluginExternal from 'vite-plugin-external';
import { view } from 'vite-plugin-view';

/**
 * 示例 2：使用函数形态的 externals
 *
 * externals 除了 Record 还支持函数签名：
 *   (source, importer, isResolved) => string | boolean | null
 * 返回 string → 作为全局变量名/CDN URL；返回 true → 纯 external。
 * 适合需要动态判断的场景（如按前缀批量外置）。
 *
 * 页面的 React / ReactDOM 全局由下面 cdnScripts 里的 umd-react 提供。
 * `ScopeFoo` 是配置里虚构的 scoped 包，仓库里没有对应的 CDN 产物，
 * 所以浏览器里 @scope/foo 那一路必然报 ReferenceError —— 这是本示例的前提
 * （宿主必须自己提供该全局），不是配置漏配。
 */
export default defineConfig(({ command, mode }) => ({
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode)
  },
  plugins: [
    view({
      engine: 'pug',
      // logLevel: 'TRACE',
      pretty: true,
      engineOptions: {
        title: 'vite-plugin-external example 2',
        description: 'Powered by vite-plugin-external',
        // externals 的 React / ReactDOM 全局由这两个 UMD 提供。
        cdnScripts: command === 'build'
          ? [
            'https://unpkg.com/umd-react/dist/react.production.min.js',
            'https://unpkg.com/umd-react/dist/react-dom.production.min.js',
            '/foo.iife.js'
          ]
          : [
            'https://unpkg.com/umd-react/dist/react.development.js',
            'https://unpkg.com/umd-react/dist/react-dom.development.js'
          ],
        entry: '/src/index-scoped.tsx'
      }
    }),
    pluginExternal({
      // logLevel: 'TRACE',
      // 每个 config 用各自的 stash 目录，测试串行复用缓存时互不覆盖。
      cacheDir: './node_modules/.vite_external/2',
      development: {
        externals(source) {
        // 所有 @scope/ 开头的包都外置，按配置根目录映射到相对地址。
        // 触发函数 externals 的动态判断分支（按前缀匹配）。
          if (source.startsWith('@scope/')) {
            return `./src${source.replace('@scope/', '/')}.ts`;
          }
          // react 系列映射到全局变量（与 Record 形态效果一致）
          if (source === 'react') {
            return 'React';
          }
          if (source === 'react-dom/client') {
            return 'ReactDOM';
          }
          return null;
        }
      },
      production: {
        externals(source) {
        // 所有 @scope/ 开头的包都外置，映射为 ScopeFoo 等驼峰全局名。
        // 触发函数 externals 的动态判断分支（按前缀匹配）。
          if (source.startsWith('@scope/')) {
            const name = source.split('/').pop() ?? 'scope';
            return `Scope${name.charAt(0).toUpperCase()}${name.slice(1)}`;
          }
          // react 系列映射到全局变量（与 Record 形态效果一致）
          if (source === 'react') {
            return 'React';
          }
          if (source === 'react-dom/client') {
            return 'ReactDOM';
          }
          return null;
        }
      }
    }),
    react(),
    buildChunk({
      build: {
        entry: 'src/foo.ts',
        format: 'iife',
        name: 'ScopeFoo',
        fileName: '[name]',
        output: {
          format: 'iife'
        }
      }
    })
  ],
  build: {
    outDir: 'dist/2',
    minify: false
  }
}));
