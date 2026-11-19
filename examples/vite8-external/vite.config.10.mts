import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

/**
 * 示例 10：字符串/正则数组形态 externals
 *
 * externals 支持 Array<string | RegExp> 形态，
 * 命中的依赖一律标记为 pure external（不生成全局变量 shim）。
 * 适合批量外置某一类包（如所有 "@babel/*"  scoped 包）。
 */
export default defineConfig({
  plugins: [
    pluginExternal({
      // 每个 config 用各自的 stash 目录，测试串行复用缓存时互不覆盖。
      cacheDir: './node_modules/.vite_external/10',
      externals: ['lodash', /^@babel\//],
      nodeBuiltins: true
    })
  ],
  build: {
    outDir: 'dist/10',
    minify: false,
    lib: {
      entry: 'src/lib.ts',
      formats: ['es'],
      fileName: 'my-lib'
    }
  }
});
