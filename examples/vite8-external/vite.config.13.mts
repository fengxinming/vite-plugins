import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';
import { view } from 'vite-plugin-view';

/**
 * 示例 13：lib.formats ['umd'] — UMD 产物同样走原生 external + output.globals
 *
 * rolldown output.globals 官方描述为 "Global variable of UMD / IIFE
 * dependencies"，umd 与 iife 同受 globals 映射；
 * 门控把 build.lib.formats 里的 umd 也识别为 globals 格式，
 * 不再误清原生 external 去走 stash 路线。
 *
 * dev 页面的 React / ReactDOM 全局由下面 cdnScripts 里的 umd-react 提供，
 * 因为 externals 把 react/react-dom 映射到 window.React / window.ReactDOM。
 */
export default defineConfig(({ command }) => ({
  plugins: [
    view({
      engine: 'pug',
      engineOptions: {
        title: 'vite-plugin-external example 13',
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
      // 每个 config 用各自的 stash 目录，测试串行复用缓存时互不覆盖。
      cacheDir: './node_modules/.vite_external/13',
      externals: {
        react: 'React',
        'react-dom': 'ReactDOM',
        'react-dom/client': 'ReactDOM'
      }
    })
  ],
  build: {
    outDir: 'dist/13',
    minify: false,
    lib: {
      entry: 'src/index.tsx',
      formats: ['umd'],
      name: 'UmdApp'
    }
  }
}));
