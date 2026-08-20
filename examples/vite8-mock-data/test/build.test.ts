import { existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

import { build, createServer, ViteDevServer } from 'vite';
import { afterEach, describe, expect, it } from 'vitest';

const root = resolve(__dirname, '..');
const dist = resolve(root, 'dist');

let server: ViteDevServer | null = null;

afterEach(async () => {
  if (server) {
    await server.close();
    server = null;
  }
  if (existsSync(dist)) {
    rmSync(dist, { recursive: true, force: true });
  }
});

async function start(configName: string): Promise<{ server: ViteDevServer, baseUrl: string }> {
  const configMod = await import(resolve(root, `vite.config.${configName}.mts`));
  const userConfig = configMod.default ?? configMod;
  server = await createServer({
    ...userConfig,
    server: {
      ...(userConfig.server ?? {}),
      host: '127.0.0.1',
      port: 0
    },
    logLevel: 'error'
  });
  await server.listen();
  const info = server.httpServer!.address() as { address: string, port: number };
  const host = info.address === '::' || info.address === '::1' ? '[::1]' : info.address;
  return { server, baseUrl: `http://${host}:${info.port}` };
}

async function jsonFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...(init ?? {}),
    headers: {
      Accept: 'application/json',
      ...((init && init.headers) ?? {})
    }
  });
  const text = await res.text();
  let data: any = null;
  try {
    data = text.length ? JSON.parse(text) : null;
  }
  catch {
    throw new Error(`Not JSON: ${text.slice(0, 200)}`);
  }
  return { res, data };
}

describe('vite-plugin-mock-data example configs', () => {
  describe('build smoke (plugin does not break build)', () => {
    it('config 1: builds successfully with file routes', async () => {
      const cfg = await import(resolve(root, 'vite.config.1.mts'));
      await build({ ...(cfg.default ?? cfg), logLevel: 'error' });
      expect(existsSync(resolve(dist, '1'))).toBe(true);
    }, 60000);

    it('config 2: builds successfully with dynamic params routes', async () => {
      const cfg = await import(resolve(root, 'vite.config.2.mts'));
      await build({ ...(cfg.default ?? cfg), logLevel: 'error' });
      expect(existsSync(resolve(dist, '2'))).toBe(true);
    }, 60000);

    it('config 3: builds successfully with inline RouteConfig', async () => {
      const cfg = await import(resolve(root, 'vite.config.3.mts'));
      await build({ ...(cfg.default ?? cfg), logLevel: 'error' });
      expect(existsSync(resolve(dist, '3'))).toBe(true);
    }, 60000);
  });

  describe('dev server: mock endpoints actually serve correct data', () => {
    it('config 1 (file route users.ts): GET list + POST create', async () => {
      const { baseUrl } = await start('1');

      // GET /api/users → 返回 users.ts 里定义的 2 个用户
      const list = await jsonFetch(`${baseUrl}/api/users`);
      expect(list.res.ok).toBe(true);
      expect(Array.isArray(list.data)).toBe(true);
      expect(list.data).toHaveLength(2);
      expect(list.data[0]).toMatchObject({ id: 1, name: 'Alice', email: 'alice@example.com' });
      expect(list.data[1]).toMatchObject({ id: 2, name: 'Bob' });

      // POST /api/users → handler 合并 body 并返回 { id:3, ...body }
      const created = await jsonFetch(`${baseUrl}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Charlie', email: 'charlie@example.com' })
      });
      expect(created.res.ok).toBe(true);
      expect(created.data).toMatchObject({
        id: 3,
        name: 'Charlie',
        email: 'charlie@example.com'
      });
    }, 60000);

    it('config 2 ([id].ts dynamic param): GET by id + PUT update + DELETE', async () => {
      const { baseUrl } = await start('2');

      // (a) GET /api/users/1 → Alice
      const u1 = await jsonFetch(`${baseUrl}/api/users/1`);
      expect(u1.res.ok).toBe(true);
      expect(u1.data).toMatchObject({ id: 1, name: 'Alice' });

      // (b) GET /api/users/999 → 404 回退: { error: 'Not found' }
      const uMiss = await jsonFetch(`${baseUrl}/api/users/999`);
      expect(uMiss.data).toMatchObject({ error: 'Not found' });

      // (c) PUT /api/users/2 → { id:2, ...body, updated:true }
      const updated = await jsonFetch(`${baseUrl}/api/users/2`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Bobby', age: 30 })
      });
      expect(updated.res.ok).toBe(true);
      expect(updated.data).toMatchObject({ id: 2, name: 'Bobby', age: 30, updated: true });

      // (d) DELETE /api/users/1 → { id:1, deleted:true }
      const deleted = await jsonFetch(`${baseUrl}/api/users/1`, { method: 'DELETE' });
      expect(deleted.res.ok).toBe(true);
      expect(deleted.data).toMatchObject({ id: 1, deleted: true });
    }, 60000);

    it('config 3 (RouteConfig object): GET config + POST echo body', async () => {
      const { baseUrl } = await start('3');

      // GET /api/config → { version: '1.0.0', features: ['mock', 'proxy'] }
      const cfg = await jsonFetch(`${baseUrl}/api/config`);
      expect(cfg.res.ok).toBe(true);
      expect(cfg.data).toMatchObject({ version: '1.0.0' });
      expect(Array.isArray(cfg.data.features)).toBe(true);
      expect(cfg.data.features).toContain('mock');
      expect(cfg.data.features).toContain('proxy');

      // POST /api/echo → handler 原样返回 req.body
      const payload = { a: 1, b: ['x', 'y'], nested: { ok: true } };
      const echo = await jsonFetch(`${baseUrl}/api/echo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      expect(echo.res.ok).toBe(true);
      expect(echo.data).toEqual(payload);
    }, 60000);
  });
});
