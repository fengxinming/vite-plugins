import { defineConfig } from 'vite';
import pluginMockData from 'vite-plugin-mock-data';

/**
 * @example vite-plugin-mock-data
 *
 * 基于文件路由自动生成 mock 接口：
 *   mock/api/users.ts  →  GET /api/users
 *   mock/api/users/[id].ts  →  GET /api/users/:id
 *
 * 开发时作为中间件提供数据，构建时也可将路由配置输出为 JSON。
 */
export default defineConfig({
  plugins: [
    pluginMockData({
      routes: './mock'
    })
  ],
  build: {
    outDir: 'dist/1',
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'index'
    }
  }
});
