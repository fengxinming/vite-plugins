import { defineConfig } from 'vite';
import pluginMockData from 'vite-plugin-mock-data';

/**
 * @example vite-plugin-mock-data
 *
 * `mockIn: false` —— 关闭浏览器端注入（默认值）。
 * 插件在 configResolved 阶段判定：
 *   mockIn === 'client' || config.command === mockIn
 * false 既不等于 'client'，也不等于 command（'serve' / 'build'）→ 门控恒为 false，
 * 无论 dev/serve 还是 vite build，virtual:mock-routes 都只下发空路由表。
 *
 * 注意：routes: './mock' 仍然配着——本例要验证的正是「即使有 mock 文件，
 * mockIn: false 也不把它们注入浏览器端」，而不是「没配 routes 所以为空」。
 *
 * 对应集成测试：test/adapter-disabled.test.ts（`pnpm test:disabled`，
 * 以本配置运行 vitest，command 为 'serve'）：
 *   - mockRoutes 长度为 0（虚拟模块下发空表）；
 *   - createMockAdapter() 返回 undefined（空表时不造 adapter）。
 * 与 no-client-mock（config 11，'build' 不越界到 serve）互补：那条验证 'build'
 * 在 serve 关闭，这条验证 false 显式关闭。dev 端的服务端 mock（fastify 中间件）
 * 不受 mockIn 影响，不在此例覆盖范围。
 */
export default defineConfig({
  plugins: [
    pluginMockData({
      routes: './mock',
      mockIn: false
    })
  ],
  test: {
    dir: './test/',
    include: [
      'adapter-disabled.test.ts'
    ]
  }
});
