import { defineConfig } from 'vite';
import pluginMockData from 'vite-plugin-mock-data';

/**
 * 示例 3：使用 RouteConfig 对象直接声明路由
 *
 * 除了文件路由，routes 也接受 RouteConfig 数组，
 * 适合不想创建 mock 文件目录、只想在 vite.config 里
 * 快速定义几个接口的场景。
 *
 * 覆盖全部路由值形态（与 configureServer.ts 运行时分流一一对应）：
 *   - 顶层静态数据：对象 / 数组 / number / boolean / null → String() 或 JSON 发送
 *   - 函数 handler：fastify 风格 `(request, reply)`，直接透传
 */
export default defineConfig({
  plugins: [
    pluginMockData({
      routes: [
        {
          // ── 顶层静态数据 ─────────────────────────────────────────
          'GET /api/str': '<h1>mock page</h1>', // string → 文本（text/plain）
          'GET /api/num': 123, // number → String() 文本
          'GET /api/bool': true, // boolean → String() 文本
          'GET /api/nil': null, // null → "null" 文本
          'GET /api/arr': [1, 2, 3], // 数组 → JSON
          'GET /api/obj': { data: { nested: true } }, // 纯数据对象 → JSON
          'GET /api/wrap': { code: 0, data: { ok: true } }, // 通用返回包装 → JSON

          // ── 函数 handler：直接透传 fastify ──────────────────────
          'GET /api/fn': async () => ({ via: 'top-level-fn' }),
          'GET /api/config': async () => ({
            version: '1.0.0',
            features: ['mock', 'proxy']
          }),
          'POST /api/echo': async (request) => request.body
        }
      ]
    })
  ],
  build: {
    outDir: 'dist/3',
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'index'
    }
  }
});
