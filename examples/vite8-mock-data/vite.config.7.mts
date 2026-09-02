import { defineConfig } from 'vite';
import pluginMockData from 'vite-plugin-mock-data';

/**
 * 示例 7：isAfter: true 选项覆盖
 *
 * - isAfter: true → mock 中间件挂载在 Vite 内置中间件之后
 * - 页面/模块请求先由 Vite 管线处理（GET / 返回注入 /@vite/client 的 HTML）
 * - POST 类 mock 路由仍可正常命中（Vite 的 htmlFallback 只重写 GET，不影响 POST）
 *
 * 注意：Vite 8 下 isAfter: true 时，GET 形式的 mock 路由会被 SPA fallback 拦截，
 * 因此本示例只用 POST 路由验证 isAfter: true 的可用面；GET mock 的覆盖见默认配置。
 */
export default defineConfig({
  plugins: [
    pluginMockData({
      routes: [
        {
          'POST /api/echo': async (request: any) => ({ echo: request.body })
        }
      ],
      isAfter: true
    })
  ],
  build: {
    outDir: 'dist/7',
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'index'
    }
  }
});
