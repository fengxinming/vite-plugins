import { defineConfig } from 'vite';
import pluginBuildChunk from 'vite-plugin-build-chunk';

/**
 * 示例 1：主构建输出 ES 格式，插件在 closeBundle 后将其二次打包为 UMD 格式。
 *
 * 验证：dist/1/ 下应同时存在 my-lib.js（ES）和 my-lib.umd.js（UMD）。
 */
export default defineConfig({
  plugins: [
    pluginBuildChunk({
      build: {
        entry: 'dist/1/my-lib.js',
        name: 'MyLib',
        format: 'umd',
        minify: false,
        fileName: () => 'my-lib.umd.js'
      }
    })
  ],
  build: {
    outDir: 'dist/1',
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'my-lib'
    }
  }
});
