import { defineConfig } from 'vite';
import pluginCombine from 'vite-plugin-combine';

/**
 * 示例 3：exports: 'both' — 同时生成 named 和 default 导出
 *
 * 合并后的文件同时包含：
 *   export { isNil, isDate, ... };
 *   export default { isNil, isDate, ... };
 */
export default defineConfig({
  plugins: [
    pluginCombine({
      src: ['src/util/*.ts', '!src/util/typings.ts'],
      target: 'src/combine.3.ts',
      exports: 'both',
      dts: true
    })
  ],
  build: {
    outDir: 'dist/3',
    minify: false,
    lib: {
      entry: [],
      formats: ['es'],
      fileName: '[name]'
    }
  }
});
