import vueJsx from '@vitejs/plugin-vue-jsx';
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';
import { view } from 'vite-plugin-view';

/**
 * 示例 6：Vue 里写 JSX + vue 外置
 *
 * @vitejs/plugin-vue-jsx 把 .jsx/.tsx 里的 JSX 编译成 Vue 的 h() 调用，
 * 编译结果依旧从 'vue' 取运行时；配合 externals 里的 vue → Vue，
 * 产物同样不含 Vue，运行时从 CDN 提供的全局变量读取。
 *
 * 与示例 9 的分工：9 走 SFC（<template> 由 @vitejs/plugin-vue 编译），
 * 本示例走 JSX 编译链——两条不同的转换路径都要覆盖。
 */
export default defineConfig(({ command }) => {
  return {
    plugins: [
      pluginExternal({
        // 每个 config 用各自的 stash 目录，测试串行复用缓存时互不覆盖。
        cacheDir: './node_modules/.vite_external/6',
        externals: {
          vue: 'Vue'
        }
      }),
      vueJsx(),
      view({
        engine: 'pug',
        engineOptions: {
          title: 'vite-plugin-external example 6',
          description: 'Powered by vite-plugin-view',
          // externals 的 Vue 全局由 Vue 的全局构建提供：dev 用可读版，build 用压缩版。
          cdnScripts: command === 'build'
            ? ['https://unpkg.com/vue@3/dist/vue.global.prod.js']
            : ['https://unpkg.com/vue@3/dist/vue.global.js'],
          entry: '/src/vue-jsx-app.tsx'
        }
      })
    ],
    build: {
      outDir: 'dist/6',
      minify: false,
      lib: {
        entry: 'src/vue-jsx-app.tsx',
        formats: ['iife'],
        name: 'MyVueJsxApp',
        fileName: 'main'
      }
    }
  };
});
