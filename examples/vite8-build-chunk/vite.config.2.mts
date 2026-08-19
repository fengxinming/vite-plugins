import { defineConfig } from 'vite';
import pluginBuildChunk from 'vite-plugin-build-chunk';

/**
 * 示例 2：build 接受数组，closeBundle 后对同一个 ES chunk 并行执行多次二次构建。
 *
 * 这里将 ES 产物同时打包为 UMD（未压缩）和 CJS（压缩）两种格式。
 * CJS 使用自定义 fileName 输出为 my-lib.cjs 避免与 ES 产物覆盖。
 *
 * 验证：dist/2/ 下应存在 my-lib.js（ES）、my-lib.umd.js（UMD）、my-lib.cjs（CJS）。
 */
export default defineConfig({
  plugins: [
    pluginBuildChunk({
      build: [
        {
          chunk: 'my-lib.js',
          name: 'MyLib',
          format: 'umd',
          minify: false
        },
        {
          chunk: 'my-lib.js',
          name: 'MyLib',
          format: 'cjs',
          exports: 'named',
          minify: true,
          fileName: () => 'my-lib.cjs'
        }
      ]
    })
  ],
  build: {
    outDir: 'dist/2',
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'my-lib'
    }
  }
});
