import { defineConfig } from 'vite';
import { view } from 'vite-plugin-view';

/**
 * 示例 4：自定义 extension — 引擎与文件扩展名不一致
 *
 * 当模板文件扩展名与引擎名称不同时，用 extension 显式指定。
 * 例如使用 handlebars 引擎但文件扩展名为 .hbs。
 */
export default defineConfig({
  plugins: [
    view({
      engine: 'handlebars',
      entry: 'index.hbs',
      extension: '.hbs',
      engineOptions: {
        title: 'Handlebars Example',
        description: 'Using .hbs extension with handlebars engine'
      }
    })
  ],
  build: {
    outDir: 'dist/4',
    rollupOptions: {
      output: {
        format: 'iife'
      }
    }
  }
});
