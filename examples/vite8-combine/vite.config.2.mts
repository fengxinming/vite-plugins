import { defineConfig } from 'vite';
import pluginCombine from 'vite-plugin-combine';

/**
 * 示例 2：exports: 'default' — 以 default 导出合并结果
 *
 * 合并后的文件形如：
 *   import isNil from './util/isNil';
 *   export default { isNil, isDate, ... };
 */
export default defineConfig({
  plugins: [
    pluginCombine({
      src: ['src/util/*.ts', '!src/util/typings.ts'],
      target: 'src/combine.2.ts',
      exports: 'default',
      dts: true
    })
  ],
  build: {
    outDir: 'dist/2',
    minify: false,
    lib: {
      entry: [],
      formats: ['es'],
      fileName: '[name]'
    }
  }
});
