import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';
import { view } from 'vite-plugin-view';

/**
 * 示例 11：自定义 cacheDir — 指定 stash 文件存放目录
 *
 * 每个命名 external 都会在 cacheDir 下生成 JS shim 文件。
 * 默认存放于 ${cwd}/node_modules/.vite_external。
 * 通过 cacheDir 可自定义位置，便于统一清理或调试。
 */
export default defineConfig(({ command }) => ({
  plugins: [
    view({
      engine: 'pug',
      engineOptions: {
        title: 'vite-plugin-external example 11',
        description: 'Powered by vite-plugin-external',
        // externals 的 React / ReactDOM 全局由这两个 UMD 提供。
        cdnScripts: command === 'build'
          ? [
            'https://unpkg.com/umd-react/dist/react.production.min.js',
            'https://unpkg.com/umd-react/dist/react-dom.production.min.js'
          ]
          : [
            'https://unpkg.com/umd-react/dist/react.development.js',
            'https://unpkg.com/umd-react/dist/react-dom.development.js'
          ]
      }
    }),
    react(),
    pluginExternal({
      cacheDir: './node_modules/.external-cache',
      externals: {
        react: 'React',
        'react-dom': 'ReactDOM',
        'react-dom/client': 'ReactDOM'
      }
    })
  ],
  build: {
    outDir: 'dist/11',
    minify: false,
    rolldownOptions: {
      output: {
        format: 'iife'
      }
    }
  }
}));
