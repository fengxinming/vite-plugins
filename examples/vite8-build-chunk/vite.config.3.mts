import { defineConfig } from 'vite';
import pluginBuildChunk from 'vite-plugin-build-chunk';

/**
 * 示例 3：sourcemap + 自定义输出目录 + 自定义 fileName。
 *
 * 主构建输出 ES 格式到 dist/3/。插件将 ES 产物二次打包为 UMD，
 * 开启 inline sourcemap，输出到独立的 chunks/ 目录。
 *
 * 验证：
 *   - dist/3/my-lib.js（主构建 ES 产物）
 *   - chunks/my-lib.bundle.js（二次构建 UMD 产物，含 inline sourcemap）
 */
export default defineConfig({
  plugins: [
    pluginBuildChunk({
      build: {
        chunk: 'my-lib.js',
        name: 'MyLib',
        format: 'umd',
        sourcemap: 'inline',
        outDir: 'dist/chunks',
        minify: false,
        fileName: () => 'my-lib.bundle.js'
      }
    })
  ],
  build: {
    outDir: 'dist/3',
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'my-lib'
    }
  }
});
