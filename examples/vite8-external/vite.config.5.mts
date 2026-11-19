import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';
import { view } from 'vite-plugin-view';

/**
 * 示例 5：interop: 'auto' — 修复 IIFE 构建中 require 包装问题
 *
 * 某些库被 output.globals 处理后仍生成错误的 require 包装。
 * interop: 'auto' 让构建阶段通过 stash 文件路径走 resolveId 解析，
 * 而非 Rolldown 原生 external 机制，从而避免 IIFE 包装异常。
 */
export default defineConfig(({ command }) => ({
  plugins: [
    view({
      engine: 'pug',
      engineOptions: {
        title: 'vite-plugin-external example 5',
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
      cacheDir: './node_modules/.vite_external/5',
      interop: 'auto',
      externals: {
        react: 'React',
        'react-dom': 'ReactDOM',
        'react-dom/client': 'ReactDOM'
      }
    })
  ],
  build: {
    outDir: 'dist/5',
    minify: false,
    rolldownOptions: {
      output: {
        format: 'iife'
      }
    }
  }
}));
