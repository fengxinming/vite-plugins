import { rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import axios from 'axios';
import { createMockAdapter } from 'vite-plugin-mock-data/axios-adapter';
import { describe, expect, it } from 'vitest';

import { runBuild } from '../../shared/example-testkit';

/**
 * 客户端 axios adapter 集成测试（新架构：静态导入 + 虚拟模块，无全局变量）。
 *
 * 装载链路（与浏览器产物完全一致）：
 *   `vite-plugin-mock-data/axios-adapter`
 *     → 静态 import `vite-plugin-mock-data/mock-client`
 *     → `virtual:mock-routes`（由 vitest.config.mts 注册的 pluginMockData
 *        { buildMock: true } 在构建/转换期注入 `./mock` 文件清单 + routeOptions）
 *
 * 覆盖：静态/函数 handler、命名参数、body 反序列化（transformRequest 序列化成
 * 字符串后由 client parseBody 还原）、query 剥离与合并、baseURL 拼接（axios.getUri）、
 * 大小写敏感（fastify 默认 caseSensitive=true）、未命中 404 且按 validateStatus 拒绝。
 *
 * 关键：adapter 通过 `axios.create({ adapter: createMockAdapter() })` 装入实例，
 * 整个链路使用 axios 的真实类型（AxiosResponse），无任何 cast / 假类型绕过类型校验。
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

/** 真实用法：无参 adapter 装进 axios 实例，类型由 axios 提供，无需任何 cast */
const api = axios.create({ adapter: createMockAdapter() });

describe('build:8 smoke (real `vite build` CLI)', () => {
  it('config 8 (buildMock: true) builds successfully', async () => {
    try {
      const { code, stdout } = await runBuild(root, 'build', 8);
      expect(code, `build:8 failed\n${stdout}`).toBe(0);
    }
    finally {
      rmSync(resolve(root, 'dist/8'), { recursive: true, force: true });
    }
  }, 60000);
});

describe('axios adapter end-to-end (client + virtual:mock-routes + real ./mock files)', () => {
  it('GET /api/users → function handler data', async () => {
    const res = await api.get('/api/users');
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.length).toBe(2);
    expect(res.data[0]).toMatchObject({ id: 1, name: 'Alice' });
    // 对象响应序列化为 JSON 字符串，再由 axios transformResponse 还原为对象；
    // content-type 默认标记 application/json（回归：旧 response 把 content-type 写反）
    expect(String(res.headers['content-type'] ?? '')).toContain('application/json');
    expect(res.status).toBe(200);
  });

  it('GET /api/users/:id → named param resolved', async () => {
    const res = await api.get('/api/users/1');
    expect(res.data).toMatchObject({ id: 1, name: 'Alice' });
  });

  it('GET /api/users/:id miss → handler 自己返回的 200 + error 体（不是路由层 404）', async () => {
    const res = await api.get('/api/users/999');
    expect(res.status).toBe(200);
    expect(res.data).toEqual({ error: 'Not found' });
  });

  it('PUT /api/users/:id → params + deserialized body', async () => {
    // axios 的 transformRequest 会把对象 body 序列化成 JSON 字符串，
    // client 侧 parseBody 必须还原成对象，handler 才能展开 request.body。
    const res = await api.put('/api/users/5', { name: 'Carol' });
    expect(res.data).toMatchObject({ id: 5, name: 'Carol', updated: true });
  });

  it('POST /api/users → body round-trip', async () => {
    const payload = { name: 'Charlie', email: 'charlie@example.com' };
    const res = await api.post('/api/users', payload);
    expect(res.data).toMatchObject({ id: 3, ...payload });
  });

  it('DELETE /api/users/:id', async () => {
    const res = await api.delete('/api/users/1');
    expect(res.data).toMatchObject({ id: 1, deleted: true });
  });

  it('path matching is case-sensitive (fastify default caseSensitive=true)', async () => {
    // 构建期未开启 ignoreTrailingSlash / caseSensitive=false，因此大小写敏感。
    // 大写路径不会命中小写路由，按未命中处理 → 404。
    await expect(api.get('/API/USERS/2')).rejects.toMatchObject({
      response: { status: 404 }
    });
  });

  it('query string is stripped before matching', async () => {
    const res = await api.get('/api/users/1?x=1&y=2');
    expect(res.data).toMatchObject({ id: 1 });
  });

  it('config.params are serialized into the url (axios.getUri) and stripped for matching', async () => {
    const res = await api.get('/api/users/1', { params: { page: 1, size: 20 } });
    expect(res.data).toMatchObject({ id: 1 });
    // config.url 保持原样，params 不回写
    expect(res.config.url).toBe('/api/users/1');
  });

  it('baseURL is joined before matching (axios.getUri)', async () => {
    const scoped = axios.create({ adapter: createMockAdapter(), baseURL: '/api' });
    const res = await scoped.get('/users');
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.length).toBe(2);
  });

  it('unmatched request → 404 rejected (regression: must NOT recurse / blow the stack)', async () => {
    // 回归点：旧 delegate 实现会无限递归并抛 RangeError: Maximum call stack size exceeded。
    // 若仍递归，抛出的将是 RangeError（无 response.status），此处断言会失败。
    await expect(api.get('/api/unknown')).rejects.toMatchObject({
      response: { status: 404 }
    });
  });

  it('validateStatus is honoured (adapter settle 语义)', async () => {
    // 默认 validateStatus 拒绝 404；显式放行后同一请求应兑现并带回状态码。
    await expect(api.get('/api/unknown')).rejects.toBeInstanceOf(axios.AxiosError);
    const res = await api.get('/api/unknown', {
      validateStatus: (s: number) => s === 404
    });
    expect(res.status).toBe(404);
  });
});
