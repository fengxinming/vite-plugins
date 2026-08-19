import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

/**
 * 示例 3：externalizeDeps — 纯 external 不生成 shim
 *
 * externalizeDeps 将指定依赖标记为"不打包"，
 * 但不生成全局变量 shim 文件。适用于 ES 模块构建，
 * 运行时由宿主环境（如 Node.js）提供这些依赖。
 */
export default defineConfig({
  plugins: [
    pluginExternal({
      externalizeDeps: ['lodash', 'dayjs', /^@babel\//]
    })
  ],
  build: {
    outDir: 'dist/3',
    lib: {
      entry: 'src/lib2.ts',
      formats: ['es'],
      fileName: 'my-lib'
    }
  }
});
