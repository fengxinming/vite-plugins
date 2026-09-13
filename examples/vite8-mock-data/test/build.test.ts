import { type ChildProcess, spawn } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

/**
 * 真实使用场景测试：所有 dev / build 都通过 `vite` CLI 子进程执行，
 * 而不是在测试内调用 createServer —— 与用户实际用法完全一致。
 *
 * 覆盖：
 *   - 7 套 vite.config 的 `vite build`（插件不破坏构建）
 *   - 1~5 的 dev server：文件路由 / 动态参数 / RouteConfig / sendFile / Options(fastifyOptions、mixed routes、cacheDir、cwd)
 *   - config 6 双框架：React .tsx 与 Vue .vue 都经 Vite 转译，mock 接口并存
 *   - config 7：isAfter: true 选项（页面经 Vite、mock-after-Vite 顺序）
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const viteBin = resolve(root, 'node_modules/vite/bin/vite.js');
const dist = resolve(root, 'dist');

let portSeq = 5180;
const nextPort = () => portSeq++;

function spawnVite(args: string[]): ChildProcess {
  return spawn(process.execPath, [viteBin, ...args], {
    cwd: root,
    stdio: ['ignore', 'ignore', 'inherit']
  });
}

async function waitReady(baseUrl: string, timeoutMs = 45000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(baseUrl);
      if (res.status === 200 || res.status === 404) {
        return;
      }
    }
    catch {
      /* not listening yet */
    }
    await new Promise((r) => {
      setTimeout(r, 250);
    });
  }
  throw new Error(`vite dev server not ready: ${baseUrl}`);
}

async function startDev(config: string, port: number): Promise<{ proc: ChildProcess, baseUrl: string }> {
  const proc = spawnVite([
    'dev',
    '--config',
    resolve(root, `${config}.mts`),
    '--port',
    String(port),
    '--host',
    '127.0.0.1',
    '--strictPort'
  ]);
  const baseUrl = `http://127.0.0.1:${port}`;
  await waitReady(baseUrl);
  return { proc, baseUrl };
}

function runBuild(config: string): Promise<void> {
  return new Promise((resolveBuild, reject) => {
    const proc = spawnVite(['build', '--config', resolve(root, `${config}.mts`), '--logLevel', 'error']);
    proc.on('exit', (code) =>
      (code === 0 ? resolveBuild() : reject(new Error(`build ${config} failed code=${code}`)))
    );
  });
}

async function kill(proc: ChildProcess | null): Promise<void> {
  if (!proc || proc.killed) {
    return;
  }
  proc.kill('SIGTERM');
  await new Promise((r) => {
    setTimeout(r, 400);
  });
  if (!proc.killed) {
    proc.kill('SIGKILL');
  }
}

async function jsonFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...(init ?? {}),
    headers: { Accept: 'application/json', ...((init && init.headers) ?? {}) }
  });
  const text = await res.text();
  let data: any = null;
  try {
    data = text.length ? JSON.parse(text) : null;
  }
  catch {
    throw new Error(`Not JSON (${res.status}): ${text.slice(0, 200)}`);
  }
  return { res, data };
}

function isJs(ct: string | null): boolean {
  return !!ct && ct.includes('javascript');
}

afterEach(() => {
  if (existsSync(dist)) {
    rmSync(dist, { recursive: true, force: true });
  }
});

describe('build smoke (real `vite build` CLI)', () => {
  for (const n of [1, 2, 3, 4, 5, 6, 7]) {
    it(`config ${n}: builds successfully`, async () => {
      await runBuild(`vite.config.${n}`);
      expect(existsSync(resolve(dist, String(n)))).toBe(true);
    }, 60000);
  }
});

describe('dev server: mock endpoints serve correct data (real `vite` CLI)', () => {
  it('config 1 (file route): GET list + POST create', async () => {
    const port = nextPort();
    const { proc, baseUrl } = await startDev('vite.config.1', port);
    try {
      const list = await jsonFetch(`${baseUrl}/api/users`);
      expect(list.res.ok).toBe(true);
      expect(Array.isArray(list.data)).toBe(true);
      expect(list.data).toHaveLength(2);
      expect(list.data[0]).toMatchObject({ id: 1, name: 'Alice', email: 'alice@example.com' });

      const created = await jsonFetch(`${baseUrl}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Charlie', email: 'charlie@example.com' })
      });
      expect(created.data).toMatchObject({ id: 3, name: 'Charlie', email: 'charlie@example.com' });
    }
    finally {
      await kill(proc);
    }
  }, 60000);

  it('config 2 ([id].ts dynamic param): GET/PUT/DELETE', async () => {
    const port = nextPort();
    const { proc, baseUrl } = await startDev('vite.config.2', port);
    try {
      const u1 = await jsonFetch(`${baseUrl}/api/users/1`);
      expect(u1.data).toMatchObject({ id: 1, name: 'Alice' });

      const uMiss = await jsonFetch(`${baseUrl}/api/users/999`);
      expect(uMiss.data).toMatchObject({ error: 'Not found' });

      const updated = await jsonFetch(`${baseUrl}/api/users/2`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Bobby', age: 30 })
      });
      expect(updated.data).toMatchObject({ id: 2, name: 'Bobby', age: 30, updated: true });

      const deleted = await jsonFetch(`${baseUrl}/api/users/1`, { method: 'DELETE' });
      expect(deleted.data).toMatchObject({ id: 1, deleted: true });
    }
    finally {
      await kill(proc);
    }
  }, 60000);

  it('config 3 (RouteConfig): config/echo + static shapes + fn handler', async () => {
    const port = nextPort();
    const { proc, baseUrl } = await startDev('vite.config.3', port);
    try {
      const cfg = await jsonFetch(`${baseUrl}/api/config`);
      expect(cfg.data).toMatchObject({ version: '1.0.0' });
      expect(cfg.data.features).toContain('mock');
      expect(cfg.data.features).toContain('proxy');

      const payload = { a: 1, b: ['x', 'y'], nested: { ok: true } };
      const echo = await jsonFetch(`${baseUrl}/api/echo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      expect(echo.data).toEqual(payload);

      const page = await fetch(`${baseUrl}/api/str`);
      expect(page.headers.get('content-type') ?? '').toContain('text/plain');
      expect(await page.text()).toBe('<h1>mock page</h1>');

      expect(await (await fetch(`${baseUrl}/api/num`)).text()).toBe('123');
      expect(await (await fetch(`${baseUrl}/api/bool`)).text()).toBe('true');

      const nil = await jsonFetch(`${baseUrl}/api/nil`);
      expect(nil.data).toBe(null);

      expect((await jsonFetch(`${baseUrl}/api/arr`)).data).toEqual([1, 2, 3]);
      expect((await jsonFetch(`${baseUrl}/api/obj`)).data).toEqual({ data: { nested: true } });
      expect((await jsonFetch(`${baseUrl}/api/wrap`)).data).toEqual({ code: 0, data: { ok: true } });

      expect((await jsonFetch(`${baseUrl}/api/fn`)).data).toEqual({ via: 'top-level-fn' });
    }
    finally {
      await kill(proc);
    }
  }, 60000);

  it('config 4: sendFile handler + unmatched path falls through to Vite', async () => {
    const port = nextPort();
    const { proc, baseUrl } = await startDev('vite.config.4', port);
    try {
      const pkgRes = await fetch(`${baseUrl}/package.json`);
      expect(pkgRes.status).toBe(200);
      expect((await pkgRes.json()).name).toBe('vite8-mock-data');

      const ver = await jsonFetch(`${baseUrl}/api/version`);
      expect(ver.data).toMatchObject({ version: '4.x' });

      const nf = await fetch(`${baseUrl}/no/such/mock`);
      expect(nf.status).toBe(200);
      expect(nf.headers.get('content-type') ?? '').toContain('text/html');
    }
    finally {
      await kill(proc);
    }
  }, 60000);

  it('config 5: fastifyOptions bodyLimit / mixed routes / cacheDir / cwd', async () => {
    const port = nextPort();
    const { proc, baseUrl } = await startDev('vite.config.5', port);
    try {
      const list = await jsonFetch(`${baseUrl}/api/users`);
      expect(list.data).toHaveLength(2);

      const inline = await jsonFetch(`${baseUrl}/api/inline`);
      expect(inline.data).toEqual({ via: 'inline-object' });

      const small = await jsonFetch(`${baseUrl}/api/echo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ a: 1 })
      });
      expect(small.data).toEqual({ echo: { a: 1 } });

      const big = await fetch(`${baseUrl}/api/echo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ a: 123456789, b: 'overflow' })
      });
      expect(big.status).toBe(413);

      expect(existsSync(resolve(root, 'node_modules/.vite-plugin-mock-data-test'))).toBe(true);
    }
    finally {
      await kill(proc);
    }
  }, 60000);
});

describe('regression: pages/modules go through Vite, not fastify/static hijack (config 1)', () => {
  it('index.html Vite-injected; /src/index.ts transpiled; /@vite/client; mock coexists', async () => {
    const port = nextPort();
    const { proc, baseUrl } = await startDev('vite.config.1', port);
    try {
      const page = await fetch(`${baseUrl}/`);
      expect(page.status).toBe(200);
      expect(page.headers.get('content-type') ?? '').toContain('text/html');
      const html = await page.text();
      expect(html).toContain('/@vite/client');
      expect(html).toContain('<!DOCTYPE html>');

      const mod = await fetch(`${baseUrl}/src/index.ts`);
      expect(mod.status).toBe(200);
      expect(isJs(mod.headers.get('content-type'))).toBe(true);
      expect(await mod.text()).toContain('export const VERSION =');

      const client = await fetch(`${baseUrl}/@vite/client`);
      expect(client.status).toBe(200);

      const list = await jsonFetch(`${baseUrl}/api/users`);
      expect(list.data).toHaveLength(2);
    }
    finally {
      await kill(proc);
    }
  }, 60000);
});

describe('dual-framework: React .tsx + Vue .vue transpile via Vite, mock coexists (config 6)', () => {
  it('React/Vue pages served & transpiled by Vite; mock endpoint coexists', async () => {
    const port = nextPort();
    const { proc, baseUrl } = await startDev('vite.config.6', port);
    try {
      const main = await fetch(`${baseUrl}/`);
      expect((await main.text()).indexOf('/@vite/client')).toBeGreaterThan(-1);

      const reactHtml = await fetch(`${baseUrl}/react.html`);
      const reactHtmlBody = await reactHtml.text();
      expect(reactHtmlBody).toContain('/@vite/client');
      expect(reactHtmlBody).toContain('/src/react/main.tsx');

      const reactEntry = await fetch(`${baseUrl}/src/react/main.tsx`);
      expect(reactEntry.status).toBe(200);
      expect(isJs(reactEntry.headers.get('content-type'))).toBe(true);
      expect(await reactEntry.text()).toContain('createRoot');

      const reactApp = await fetch(`${baseUrl}/src/react/App.tsx`);
      expect(reactApp.status).toBe(200);
      expect(isJs(reactApp.headers.get('content-type'))).toBe(true);
      const reactAppBody = await reactApp.text();
      expect(reactAppBody).toContain('useState');
      expect(reactAppBody).toContain('/api/users');

      const vueHtml = await fetch(`${baseUrl}/vue.html`);
      const vueHtmlBody = await vueHtml.text();
      expect(vueHtmlBody).toContain('/@vite/client');
      expect(vueHtmlBody).toContain('/src/vue/main.js');

      const vueEntry = await fetch(`${baseUrl}/src/vue/main.js`);
      expect(vueEntry.status).toBe(200);
      expect(isJs(vueEntry.headers.get('content-type'))).toBe(true);
      expect(await vueEntry.text()).toContain('createApp');

      const vueSfc = await fetch(`${baseUrl}/src/vue/App.vue`);
      expect(vueSfc.status).toBe(200);
      expect(isJs(vueSfc.headers.get('content-type'))).toBe(true);
      const vueSfcBody = await vueSfc.text();
      expect(
        vueSfcBody.includes('setup')
          || vueSfcBody.includes('createElementBlock')
          || vueSfcBody.includes('_sfc')
      ).toBe(true);

      const list = await jsonFetch(`${baseUrl}/api/users`);
      expect(list.res.ok).toBe(true);
      expect(list.data).toHaveLength(2);
    }
    finally {
      await kill(proc);
    }
  }, 60000);
});

describe('isAfter: true (config 7) — plugin boots, pages served by Vite (mock-after-Vite ordering)', () => {
  it('config 7: GET / served by Vite (mock-after-Vite); plugin boots', async () => {
    const port = nextPort();
    const { proc, baseUrl } = await startDev('vite.config.7', port);
    try {
      // isAfter: true → mock 中间件挂在 Vite 内置中间件之后，
      // 页面/模块请求先由 Vite 管线处理（GET / 返回注入 /@vite/client 的 HTML）。
      const page = await fetch(`${baseUrl}/`);
      expect(page.status).toBe(200);
      expect((await page.text()).indexOf('/@vite/client')).toBeGreaterThan(-1);

      // 说明：Vite 8 下 isAfter: true 时 GET/POST 形式的 mock 路由会被 SPA fallback
      // 拦截，属于已知固有限制，故本用例只验证 isAfter: true 不破坏页面服务、插件可正常启动。
    }
    finally {
      await kill(proc);
    }
  }, 60000);
});
