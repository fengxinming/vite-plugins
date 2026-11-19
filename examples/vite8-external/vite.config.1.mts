import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';
import { view } from 'vite-plugin-view';

/**
 * @example vite-plugin-external
 *
 * 将 react / react-dom 标记为外部依赖，构建产物中不包含它们，
 * 运行时从全局变量 `React` / `ReactDOM` 读取。
 * 适用于 CDN 加载依赖的 IIFE/UMD 构建场景。
 */
export default defineConfig(({ command }) => {
  return {
    plugins: [
      pluginExternal({
        // 每个 config 用各自的 stash 目录，测试串行复用缓存时互不覆盖。
        cacheDir: './node_modules/.vite_external/1',
        // logLevel: 'TRACE',
        externals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react-dom/client': 'ReactDOM'
        }
      }),
      react(),
      view({
        engine: 'pug',
        engineOptions: {
          title: 'vite-plugin-external example 1',
          description: 'Powered by vite-plugin-view',
          // externals 把 react/react-dom 映射到 window.React / window.ReactDOM，
          // 页面必须挂对应的 UMD，否则示例在浏览器里跑不起来。
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
      })
    ],
    build: {
      outDir: 'dist/1',
      minify: false,
      rolldownOptions: {
        output: {
          format: 'iife'
        }
      }
    }
  };
});
