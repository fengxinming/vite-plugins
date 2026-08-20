import { defineConfig } from 'vite';
import pluginCombine from 'vite-plugin-combine';

/**
 * 示例 6：exports: 'none' — 只导入不导出
 *
 * 合并后的文件只有 import 语句和空 export {}，
 * 适用于仅需执行副作用模块的场景。
 */
export default defineConfig({
  plugins: [
    pluginCombine({
      src: ['src/util/*.ts', '!src/util/typings.ts'],
      target: 'src/combine.6.ts',
      exports: 'none',
      dts: true
    })
  ],
  build: {
    outDir: 'dist/6',
    minify: false,
    lib: {
      entry: [],
      formats: ['es'],
      fileName: '[name]'
    }
  }
});
