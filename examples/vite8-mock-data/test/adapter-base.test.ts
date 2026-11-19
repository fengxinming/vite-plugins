import axios from 'axios';
import { createMockAdapter } from 'vite-plugin-mock-data/axios-adapter';
import { describe, expect, it } from 'vitest';

/**
 * 客户端 axios adapter 的 `base` 前缀集成测试（config 9：插件显式 base:'/app'）。
 *
 * `base` 是拼接在「已定义的 mock 路由」之前的路由前缀，两端各自用上：
 *   - dev 端（服务端）：configureServer 用 fastify `register(..., { prefix })` 注册，
 *     实际访问路径为 /app/api/users；
 *   - 客户端（浏览器端）：`virtual:mock-routes` 把 base 下发，normalizeRoutes 把前缀
 *     编进路径正则，axios adapter 只命中 /app/api/users。
 *
 * 客户端要用带前缀的路径有两种写法，都得命中：
 *   - 配 axios baseURL='/app'，请求 '/api/users' → getUri 拼成 /app/api/users；
 *   - 直接写全 '/app/api/users'。
 * 而未带前缀的 /api/users 不在路由表里，按 404 拒绝（前缀是路由表的一部分，
 * 不是可有可无）。
 *
 * 装载链路：
 *   `vite-plugin-mock-data/axios-adapter`
 *     → 静态 import `vite-plugin-mock-data/mock-client`
 *     → `virtual:mock-routes`（本套件以 `vitest --config vite.config.9.mts` 运行，
 *        插件 { mockIn:'client', base:'/app' } 注入 base='/app'）
 *     → normalizeRoutes(routes, routeOptions, base) 把 '/app' 烤进路径正则。
 *
 * 「未配 base 时兜底取 Vite base」不在这里验证：vitest 的 server base 固定在根路径，
 * 兜底拿到的 resolvedConfig.base 与真实 dev/build 环境不同；兜底的服务端表现由
 * test/build.test.ts 的 dev:10 用例覆盖（真实 vite CLI）。
 */
describe('axios adapter with base prefix (config 9: base="/app")', () => {
  /** 真实用法：无参 adapter 装进 axios 实例，类型由 axios 提供，无需任何 cast */
  const api = axios.create({ adapter: createMockAdapter() });

  it('GET /app/api/users → prefixed route hits function handler', async () => {
    const res = await api.get('/app/api/users');
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.length).toBe(2);
    expect(res.data[0]).toMatchObject({ id: 1, name: 'Alice', email: 'alice@example.com' });
    expect(String(res.headers['content-type'] ?? '')).toContain('application/json');
    expect(res.status).toBe(200);
  });

  it('GET /app/api/users/:id → named param resolved under prefix', async () => {
    const res = await api.get('/app/api/users/1');
    expect(res.data).toMatchObject({ id: 1, name: 'Alice' });
  });

  it('POST /app/api/users → body round-trip under prefix', async () => {
    const payload = { name: 'Charlie', email: 'charlie@example.com' };
    const res = await api.post('/app/api/users', payload);
    expect(res.data).toMatchObject({ id: 3, ...payload });
  });

  it('PUT /app/api/users/:id → params + deserialized body under prefix', async () => {
    const res = await api.put('/app/api/users/5', { name: 'Carol' });
    expect(res.data).toMatchObject({ id: 5, name: 'Carol', updated: true });
  });

  it('unprefixed /api/users → 404 (base is baked into the route table, not optional)', async () => {
    // 路由表里只有 /app/api/users，未带前缀的请求不得命中。
    await expect(api.get('/api/users')).rejects.toMatchObject({
      response: { status: 404 }
    });
  });

  it('unprefixed /api/users/:id → 404 (prefix applies to dynamic routes too)', async () => {
    await expect(api.get('/api/users/1')).rejects.toMatchObject({
      response: { status: 404 }
    });
  });

  it('axios baseURL "/app" is joined by getUri then matched against the prefixed table', async () => {
    // baseURL 与插件 base 同值：axios.getUri 拼出 /app/api/users 后命中前缀路由表。
    const scoped = axios.create({ adapter: createMockAdapter(), baseURL: '/app' });
    const res = await scoped.get('/api/users');
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.length).toBe(2);
  });
});
