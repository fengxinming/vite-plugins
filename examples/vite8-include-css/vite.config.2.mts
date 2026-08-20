import { defineConfig } from 'vite';
import pluginIncludeCss from 'vite-plugin-include-css';

/**
 * 示例 2：多个 CSS 文件内联
 *
 * 当项目有多个 CSS 文件时，include-css 会将它们全部
 * 合并并内联到 JS 产物中。适合组件库将分散的样式
 * 统一打包，使用者无需单独引入 CSS。
 */
export default defineConfig({
  plugins: [
    pluginIncludeCss()
  ],
  build: {
    outDir: 'dist/2',
    cssCodeSplit: false,
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs'],
      fileName(format, entryName) {
        return entryName + (format === 'es' ? '.mjs' : '.js');
      }
    }
  }
});
