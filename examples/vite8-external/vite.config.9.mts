import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';
import { view } from 'vite-plugin-view';

/**
 * 示例 9：Vue 框架外置
 *
 * 将 vue 标记为外部依赖，构建产物不包含 Vue，
 * 运行时从全局变量 Vue 读取。适用于通过 CDN 加载 Vue 的页面。
 *
 * 页面由 vite-plugin-view 渲染 index.pug，cdnScripts 给出 Vue 的全局构建地址；
 * 没有这个页面，示例在浏览器里就跑不起来（external 依赖必须由宿主提供全局变量）。
 */
export default defineConfig(({ command }) => {
  return {
    plugins: [
      pluginExternal({
        // 每个 config 用各自的 stash 目录，测试串行复用缓存时互不覆盖。
        cacheDir: './node_modules/.vite_external/9',
        externals: {
          vue: 'Vue'
        }
      }),
      vue(),
      view({
        engine: 'pug',
        engineOptions: {
          title: 'vite-plugin-external example 9',
          description: 'Powered by vite-plugin-view',
          // externals 的 Vue 全局由 Vue 的全局构建提供：dev 用可读版，build 用压缩版。
          cdnScripts: command === 'build'
            ? ['https://unpkg.com/vue@3/dist/vue.global.prod.js']
            : ['https://unpkg.com/vue@3/dist/vue.global.js'],
          entry: '/src/vue-app.ts'
        }
      })
    ],
    build: {
      outDir: 'dist/9',
      minify: false,
      lib: {
        entry: 'src/vue-app.ts',
        formats: ['iife'],
        name: 'MyVueApp',
        fileName: 'main'
      }
    }
  };
});
