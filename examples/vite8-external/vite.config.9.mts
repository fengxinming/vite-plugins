import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

/**
 * 示例 9：Vue 框架外置
 *
 * 将 vue 标记为外部依赖，构建产物不包含 Vue，
 * 运行时从全局变量 Vue 读取。适用于通过 CDN 加载 Vue 的页面。
 */
export default defineConfig({
  plugins: [
    pluginExternal({
      externals: {
        vue: 'Vue'
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
});
