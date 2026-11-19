import axios from 'axios';
import { createMockAdapter } from 'vite-plugin-mock-data/axios-adapter';
import { describe, expect, it } from 'vitest';

/**
 * `mockIn: 'build'` 不越界到 serve（config 11）。
 *
 * 插件在 configResolved 阶段的判定是：
 *   mockIn === 'client' || (mockIn === 'build' && command === 'build')
 * 本套件以 `vitest --config vite.config.11.mts` 运行，command 是 'serve'、
 * mockIn 是 'build' → 虚拟模块不下发路由表 → 前端没有 mock 路由。
 *
 * 断言方式：前端发起请求时拿不到任何 mock 数据（既不是 Alice 列表，也没有 404
 * 响应体），即前端 mock 确实没生效。dev 端的服务端 mock（fastify 中间件）与这条
 * 前端链互不相干，由 test/build.test.ts 的 dev:11 用例单独覆盖。
 */
describe("mockIn: 'build' does not leak into serve (config 11)", () => {
  /** 真实用法：无参 adapter 装进 axios 实例，类型由 axios 提供，无需任何 cast */
  const api = axios.create({ adapter: createMockAdapter() });

  it('前端拿不到 mock 路由表：请求不会命中任何 mock 数据', async () => {
    // 无论请求是成功还是失败，都不允许出现 mock 数据（Alice / mock 响应体）。
    const result = await api.get('/api/users').then(
      (res) => ({ status: res.status, data: res.data }),
      (error: unknown) => ({
        status: (error as { response?: { status?: number } })?.response?.status,
        data: (error as { response?: { data?: unknown } })?.response?.data
      })
    );
    expect(result.status).not.toBe(200);
    expect(JSON.stringify(result.data ?? '')).not.toContain('Alice');
  });
});
