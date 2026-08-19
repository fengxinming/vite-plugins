import { defineConfig } from 'vite';
import { view } from 'vite-plugin-view';

/**
 * 示例 3：使用 nunjucks + 自定义 filter
 *
 * nunjucks 支持自定义 filter 扩展模板能力。
 * 通过 engineSource.requires.nunjucks 替换默认的 Environment 实例，
 * 可以注册自定义 filter（如 stringify、truncate 等）。
 */
export default defineConfig({
  plugins: [
    view({
      engine: 'nunjucks',
      entry: 'index.njk',
      extension: '.njk',
      engineOptions: {
        title: 'Nunjucks Example',
        data: { name: 'Vite', version: 8 }
      }
    })
  ],
  build: {
    outDir: 'dist/3',
    rollupOptions: {
      output: {
        format: 'iife'
      }
    }
  }
});
