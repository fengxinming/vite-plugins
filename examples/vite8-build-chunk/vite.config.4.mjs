import { defineConfig } from 'vite';
import pluginBuildChunk from 'vite-plugin-build-chunk';

/**
 * 示例 4：已废弃的 `chunk` 选项 —— `entry` 的向后兼容别名。
 *
 * 关键点：`chunk` 的相对值以**主构建的 outDir** 为基准解析。这里只写
 * `'my-lib.js'`，插件应拼出 `dist/4/my-lib.js`；若按项目根解析会直接
 * 找不到入口而失败 —— 这正是本用例要盯住的回归点。
 *
 * 用 `.mjs` 而非 `.mts`：只写 `chunk` 是旧版 JS 配置的形态，而当前类型里
 * `entry` 是必填（`chunk` 仅为运行时兜底），`.mjs` 不受类型约束。
 */
export default defineConfig({
  plugins: [
    pluginBuildChunk({
      build: {
        chunk: 'my-lib.js',
        name: 'MyLib',
        format: 'umd',
        minify: false,
        fileName: () => 'my-lib.legacy.umd.js'
      }
    })
  ],
  build: {
    outDir: 'dist/4',
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'my-lib'
    }
  }
});
