import { defineConfig } from 'vite';
import pluginCombine from 'vite-plugin-combine';

/**
 * @example vite-plugin-combine
 *
 * 将 src/util 下多个工具模块合并为单个入口文件，
 * 减少运行时 import 开销，适合工具库打包场景。
 * nameExport: true 以文件名的驼峰化作为导出名。
 */
export default defineConfig({
  plugins: [
    pluginCombine({
      src: ['src/util/*.ts', '!src/util/typings.ts'],
      target: 'src/combine.1.ts',
      nameExport: true,
      dts: true
    })
  ],
  build: {
    outDir: 'dist/1',
    minify: false,
    lib: {
      entry: [],
      formats: ['es'],
      fileName: '[name]'
    }
  }
});
