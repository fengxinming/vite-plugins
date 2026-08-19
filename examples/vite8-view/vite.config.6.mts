import { defineConfig } from 'vite';
import { view } from 'vite-plugin-view';

/**
 * 示例 6：自定义 extension — 引擎与文件扩展名不一致
 *
 * 当模板文件扩展名与引擎名称不同时，用 extension 显式指定。
 * 例如使用 ejs 引擎但文件扩展名为 .template，
 * 需要 extension: '.template' 让插件知道处理哪些文件。
 */
export default defineConfig({
  plugins: [
    view({
      engine: 'ejs',
      entry: 'index.template',
      extension: '.template',
      engineOptions: {
        title: 'Custom Extension',
        items: ['Alpha', 'Beta', 'Gamma']
      }
    })
  ],
  build: {
    outDir: 'dist/6'
  }
});
