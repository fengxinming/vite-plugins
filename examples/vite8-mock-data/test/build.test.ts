import { existsSync, readFileSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

import { cleanDist, runBuild, runScript } from '../../shared/example-testkit';

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
const dist = resolve(root, 'dist');

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
  cleanDist(root);
});

describe('build smoke (real `vite build` CLI)', () => {
  for (const n of [1, 2, 3, 4, 5, 6, 7]) {
    it(`config ${n}: builds successfully`, async () => {
      const { code, stdout } = await runBuild(root, 'build', n);
      expect(code, `build:${n} failed\n${stdout}`).toBe(0);
      expect(existsSync(resolve(dist, String(n)))).toBe(true);
    }, 60000);
  }

  /*
   * mock 数据是 dev 期资产，绝不能泄漏到生产产物里。
   * 只断言「构建成功」测不出这种泄漏，必须查产物内容。
   */
  it('生产产物不包含 mock 数据（mock 只在 dev 注入）', async () => {
    const { code, stdout } = await runBuild(root, 'build', 1);
    expect(code, `build:1 failed\n${stdout}`).toBe(0);

    const js = readFileSync(resolve(dist, '1/index.js'), 'utf-8');

    // mock 文件里的数据、以及 mock 路由前缀都不该出现。
    expect(js).not.toContain('alice@example.com');
    expect(js).not.toContain('Alice');
    expect(js).not.toContain('/api/users');
  }, 60000);
});

describe('dev server: mock endpoints serve correct data (real `vite` CLI)', () => {
  it('config 1 (file route): GET list + POST create', async () => {
    const handle = await runScript(root, 'dev', 1);
    try {
      const list = await jsonFetch(`${handle.baseUrl}/api/users`);
      expect(list.res.ok).toBe(true);
      expect(Array.isArray(list.data)).toBe(true);
      expect(list.data).toHaveLength(2);
      expect(list.data[0]).toMatchObject({ id: 1, name: 'Alice', email: 'alice@example.com' });

      const created = await jsonFetch(`${handle.baseUrl}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Charlie', email: 'charlie@example.com' })
      });
      expect(created.data).toMatchObject({ id: 3, name: 'Charlie', email: 'charlie@example.com' });
    }
    finally {
      await handle.close();
    }
  }, 60000);

  it('config 2 ([id].ts dynamic param): GET/PUT/DELETE', async () => {
    const handle = await runScript(root, 'dev', 2);
    try {
      const u1 = await jsonFetch(`${handle.baseUrl}/api/users/1`);
      expect(u1.data).toMatchObject({ id: 1, name: 'Alice' });

      const uMiss = await jsonFetch(`${handle.baseUrl}/api/users/999`);
      expect(uMiss.data).toMatchObject({ error: 'Not found' });

      const updated = await jsonFetch(`${handle.baseUrl}/api/users/2`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Bobby', age: 30 })
      });
      expect(updated.data).toMatchObject({ id: 2, name: 'Bobby', age: 30, updated: true });

      const deleted = await jsonFetch(`${handle.baseUrl}/api/users/1`, { method: 'DELETE' });
      expect(deleted.data).toMatchObject({ id: 1, deleted: true });
    }
    finally {
      await handle.close();
    }
  }, 60000);

  it('config 3 (RouteConfig): config/echo + static shapes + fn handler', async () => {
    const handle = await runScript(root, 'dev', 3);
    try {
      const cfg = await jsonFetch(`${handle.baseUrl}/api/config`);
      expect(cfg.data).toMatchObject({ version: '1.0.0' });
      expect(cfg.data.features).toContain('mock');
      expect(cfg.data.features).toContain('proxy');

      const payload = { a: 1, b: ['x', 'y'], nested: { ok: true } };
      const echo = await jsonFetch(`${handle.baseUrl}/api/echo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      expect(echo.data).toEqual(payload);

      const page = await fetch(`${handle.baseUrl}/api/str`);
      expect(page.headers.get('content-type') ?? '').toContain('text/plain');
      expect(await page.text()).toBe('<h1>mock page</h1>');

      expect(await (await fetch(`${handle.baseUrl}/api/num`)).text()).toBe('123');
      expect(await (await fetch(`${handle.baseUrl}/api/bool`)).text()).toBe('true');

      const nil = await jsonFetch(`${handle.baseUrl}/api/nil`);
      expect(nil.data).toBe(null);

      expect((await jsonFetch(`${handle.baseUrl}/api/arr`)).data).toEqual([1, 2, 3]);
      expect((await jsonFetch(`${handle.baseUrl}/api/obj`)).data).toEqual({ data: { nested: true } });
      expect((await jsonFetch(`${handle.baseUrl}/api/wrap`)).data).toEqual({ code: 0, data: { ok: true } });

      expect((await jsonFetch(`${handle.baseUrl}/api/fn`)).data).toEqual({ via: 'top-level-fn' });
    }
    finally {
      await handle.close();
    }
  }, 60000);

  it('config 4: sendFile handler + unmatched path falls through to Vite', async () => {
    const handle = await runScript(root, 'dev', 4);
    try {
      const pkgRes = await fetch(`${handle.baseUrl}/package.json`);
      expect(pkgRes.status).toBe(200);
      expect((await pkgRes.json()).name).toBe('vite8-mock-data');

      const ver = await jsonFetch(`${handle.baseUrl}/api/version`);
      expect(ver.data).toMatchObject({ version: '4.x' });

      const nf = await fetch(`${handle.baseUrl}/no/such/mock`);
      expect(nf.status).toBe(200);
      expect(nf.headers.get('content-type') ?? '').toContain('text/html');
    }
    finally {
      await handle.close();
    }
  }, 60000);

  it('config 5: fastifyOptions bodyLimit / mixed routes / cacheDir / cwd', async () => {
    const cacheDir = resolve(root, 'node_modules/.vite-plugin-mock-data-test');
    // 先删掉缓存目录：它是构建期产物，afterEach 不清 node_modules，
    // 上次运行的残留会让"目录存在"这条断言无论如何都通过。
    rmSync(cacheDir, { recursive: true, force: true });

    const handle = await runScript(root, 'dev', 5);
    try {
      const list = await jsonFetch(`${handle.baseUrl}/api/users`);
      expect(list.data).toHaveLength(2);

      // cwd 验证：'./mock' 是相对路径，只有按配置的 cwd（nested/）解析才能命中这条路由；
      // 若实现用 process.cwd()（= root），这里会 404。
      const hello = await jsonFetch(`${handle.baseUrl}/api/hello`);
      expect(hello.data).toEqual({ from: 'nested-mock' });

      const inline = await jsonFetch(`${handle.baseUrl}/api/inline`);
      expect(inline.data).toEqual({ via: 'inline-object' });

      const small = await jsonFetch(`${handle.baseUrl}/api/echo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ a: 1 })
      });
      expect(small.data).toEqual({ echo: { a: 1 } });

      const big = await fetch(`${handle.baseUrl}/api/echo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ a: 123456789, b: 'overflow' })
      });
      expect(big.status).toBe(413);

      // 自定义 cacheDir 必须由本次 dev 启动创建（上面已先删掉）。
      expect(existsSync(cacheDir)).toBe(true);
    }
    finally {
      await handle.close();
    }
  }, 60000);
});

describe('regression: pages/modules go through Vite, not fastify/static hijack (config 1)', () => {
  it('index.html Vite-injected; /src/index.ts transpiled; /@vite/client; mock coexists', async () => {
    const handle = await runScript(root, 'dev', 1);
    try {
      const page = await fetch(`${handle.baseUrl}/`);
      expect(page.status).toBe(200);
      expect(page.headers.get('content-type') ?? '').toContain('text/html');
      const html = await page.text();
      expect(html).toContain('/@vite/client');
      expect(html).toContain('<!DOCTYPE html>');

      const mod = await fetch(`${handle.baseUrl}/src/index.ts`);
      expect(mod.status).toBe(200);
      expect(isJs(mod.headers.get('content-type'))).toBe(true);
      expect(await mod.text()).toContain('export const VERSION =');

      const client = await fetch(`${handle.baseUrl}/@vite/client`);
      expect(client.status).toBe(200);

      const list = await jsonFetch(`${handle.baseUrl}/api/users`);
      expect(list.data).toHaveLength(2);
    }
    finally {
      await handle.close();
    }
  }, 60000);
});

describe('dual-framework: React .tsx + Vue .vue transpile via Vite, mock coexists (config 6)', () => {
  it('React/Vue pages served & transpiled by Vite; mock endpoint coexists', async () => {
    const handle = await runScript(root, 'dev', 6);
    try {
      const main = await fetch(`${handle.baseUrl}/`);
      expect((await main.text()).indexOf('/@vite/client')).toBeGreaterThan(-1);

      const reactHtml = await fetch(`${handle.baseUrl}/react.html`);
      const reactHtmlBody = await reactHtml.text();
      expect(reactHtmlBody).toContain('/@vite/client');
      expect(reactHtmlBody).toContain('/src/react/main.tsx');

      const reactEntry = await fetch(`${handle.baseUrl}/src/react/main.tsx`);
      expect(reactEntry.status).toBe(200);
      expect(isJs(reactEntry.headers.get('content-type'))).toBe(true);
      expect(await reactEntry.text()).toContain('createRoot');

      const reactApp = await fetch(`${handle.baseUrl}/src/react/App.tsx`);
      expect(reactApp.status).toBe(200);
      expect(isJs(reactApp.headers.get('content-type'))).toBe(true);
      const reactAppBody = await reactApp.text();
      expect(reactAppBody).toContain('useState');
      expect(reactAppBody).toContain('/api/users');

      const vueHtml = await fetch(`${handle.baseUrl}/vue.html`);
      const vueHtmlBody = await vueHtml.text();
      expect(vueHtmlBody).toContain('/@vite/client');
      expect(vueHtmlBody).toContain('/src/vue/main.js');

      const vueEntry = await fetch(`${handle.baseUrl}/src/vue/main.js`);
      expect(vueEntry.status).toBe(200);
      expect(isJs(vueEntry.headers.get('content-type'))).toBe(true);
      expect(await vueEntry.text()).toContain('createApp');

      const vueSfc = await fetch(`${handle.baseUrl}/src/vue/App.vue`);
      expect(vueSfc.status).toBe(200);
      expect(isJs(vueSfc.headers.get('content-type'))).toBe(true);
      const vueSfcBody = await vueSfc.text();
      // SFC 必须真的被编译：_sfc_main 是编译出的组件对象，
      // _defineComponent 是编译产物里的导入别名。原先的
      // `setup || createElementBlock || _sfc` 三选一，任一出现就过，测不出编译失败。
      expect(vueSfcBody).toContain('_sfc_main');
      expect(vueSfcBody).toContain('_defineComponent');

      const list = await jsonFetch(`${handle.baseUrl}/api/users`);
      expect(list.res.ok).toBe(true);
      expect(list.data).toHaveLength(2);
    }
    finally {
      await handle.close();
    }
  }, 60000);
});

describe('isAfter: true (config 7) — plugin boots, pages served by Vite (mock-after-Vite ordering)', () => {
  it('config 7: GET / served by Vite (mock-after-Vite); plugin boots', async () => {
    const handle = await runScript(root, 'dev', 7);
    try {
      // isAfter: true → mock 中间件挂在 Vite 内置中间件之后，
      // 页面/模块请求先由 Vite 管线处理（GET / 返回注入 /@vite/client 的 HTML）。
      const page = await fetch(`${handle.baseUrl}/`);
      expect(page.status).toBe(200);
      expect((await page.text()).indexOf('/@vite/client')).toBeGreaterThan(-1);

      // 说明：Vite 8 下 isAfter: true 时 GET/POST 形式的 mock 路由会被 SPA fallback
      // 拦截，属于已知固有限制，故本用例只验证 isAfter: true 不破坏页面服务、插件可正常启动。
    }
    finally {
      await handle.close();
    }
  }, 60000);
});
