import { defineConfig } from 'vite';
import pluginMockData from 'vite-plugin-mock-data';

/**
 * 示例 4：sendFile handler + 404 回退
 *
 * - 顶层函数 handler 里调 `reply.sendFile()` 服务磁盘文件
 *   （@fastify/static 提供 sendFile 能力，注册在 configureServer 内）
 * - 未匹配的请求会通过 fastify 的 404 处理回退给 Vite 中间件链路
 *   （例如 SPA fallback 返回 index.html）
 */
export default defineConfig({
  plugins: [
    pluginMockData({
      routes: [
        {
          '/package.json': async (_request, reply) =>
            reply.sendFile('package.json', process.cwd()),
          '/api/version': async () => ({ version: '4.x' })
        }
      ]
    })
  ],
  build: {
    outDir: 'dist/4',
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'index'
    }
  }
});
