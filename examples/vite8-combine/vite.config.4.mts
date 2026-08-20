import { defineConfig } from 'vite';
import pluginCombine from 'vite-plugin-combine';

/**
 * 示例 4：nameExport 函数 — 自定义导出名转换
 *
 * nameExport 接受 (name, filePath) => string 函数，
 * 可以按自己的规则转换导出名（如加前缀、去后缀等）。
 */
export default defineConfig({
  plugins: [
    pluginCombine({
      src: ['src/util/*.ts', '!src/util/typings.ts'],
      target: 'src/combine.4.ts',
      nameExport(name) {
        return `my${name.charAt(0).toUpperCase()}${name.slice(1)}`;
      },
      dts: true
    })
  ],
  build: {
    outDir: 'dist/4',
    minify: false,
    lib: {
      entry: [],
      formats: ['es'],
      fileName: '[name]'
    }
  }
});
