import { defineConfig } from 'vite';
import { view } from 'vite-plugin-view';

/**
 * 示例 2：使用 ejs 模板引擎
 *
 * 将 engine 切换为 ejs，入口文件变为 index.ejs。
 * ejs 语法更接近 HTML，学习成本更低。
 */
export default defineConfig({
  plugins: [
    view({
      engine: 'ejs',
      entry: 'index.ejs',
      extension: '.ejs',
      engineOptions: {
        title: 'EJS Example',
        items: ['Apple', 'Banana', 'Cherry']
      }
    })
  ],
  build: {
    outDir: 'dist/2',
    rollupOptions: {
      output: {
        format: 'iife'
      }
    }
  }
});
