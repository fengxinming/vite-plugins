import { defineConfig } from 'vite';
import pluginIncludeCss from 'vite-plugin-include-css';

/**
 * @example vite-plugin-include-css
 *
 * 将 CSS 样式内联到 JS 产物中，运行时自动注入 <style> 标签。
 * 适用于组件库打包，让使用者无需单独引入 CSS 文件。
 * 需要 cssCodeSplit: false 配合使用。
 */
export default defineConfig({
  plugins: [
    pluginIncludeCss()
  ],
  build: {
    outDir: 'dist/1',
    cssCodeSplit: false,
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'my-component'
    }
  }
});
