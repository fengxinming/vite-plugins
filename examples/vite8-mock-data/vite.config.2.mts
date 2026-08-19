import { defineConfig } from 'vite';
import pluginMockData from 'vite-plugin-mock-data';

/**
 * 示例 2：动态路由参数 + 多 HTTP 方法
 *
 * 文件路径中的 [param] 会被转换为路由参数：
 *   mock/api/users/[id].ts  →  GET /api/users/:id
 *
 * 同一个文件可导出多个 HTTP 方法的 handler。
 */
export default defineConfig({
  plugins: [
    pluginMockData({
      routes: './mock'
    })
  ],
  build: {
    outDir: 'dist/2',
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'index'
    }
  }
});
