import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

/**
 * 示例 8：nodeBuiltins + externalizeDeps — Node 库构建
 *
 * 构建 Node.js 工具库时，将 Node 内置模块和指定依赖全部标记为 external。
 * nodeBuiltins: true 自动外置 fs/path/stream 等所有内置模块。
 * externalizeDeps 额外外置指定第三方包（不生成 shim）。
 */
export default defineConfig({
  plugins: [
    pluginExternal({
      // 每个 config 用各自的 stash 目录，测试串行复用缓存时互不覆盖。
      cacheDir: './node_modules/.vite_external/8',
      nodeBuiltins: true,
      externalizeDeps: ['lodash', 'dayjs']
    })
  ],
  build: {
    outDir: 'dist/8',
    minify: false,
    lib: {
      entry: 'src/lib.ts',
      formats: ['es'],
      fileName: 'my-lib'
    }
  }
});
