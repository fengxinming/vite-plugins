import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

/**
 * 示例 12：按模式覆盖 externalizeDeps + nodeBuiltins
 *
 * 根配置只外置 lodash；production 模式追加 dayjs（数组 concat + 去重）
 * 并开启 nodeBuiltins。vite build 默认 mode 即 production，
 * 因此构建产物应同时满足三者的效果。
 */
export default defineConfig({
  plugins: [
    pluginExternal({
      externalizeDeps: ['lodash'],
      production: {
        externalizeDeps: ['dayjs'],
        nodeBuiltins: true
      }
    })
  ],
  build: {
    outDir: 'dist/12',
    minify: false,
    lib: {
      entry: 'src/lib.ts',
      formats: ['es'],
      fileName: 'my-lib'
    }
  }
});
