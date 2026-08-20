import { defineConfig } from 'vite';
import { view } from 'vite-plugin-view';

/**
 * @example vite-plugin-view
 *
 * 使用模板引擎（pug）替代静态 HTML 作为入口，
 * 构建/开发时动态渲染模板为 HTML。
 * 支持 59 种模板引擎（pug / ejs / nunjucks / handlebars 等）。
 */
export default defineConfig({
  plugins: [
    view({
      engine: 'pug',
      engineOptions: {
        title: 'My App',
        description: 'Powered by vite-plugin-view'
      }
    })
  ],
  build: {
    outDir: 'dist/1',
    rollupOptions: {
      output: {
        format: 'iife'
      }
    }
  }
});
