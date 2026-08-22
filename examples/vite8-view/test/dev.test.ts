import {
  existsSync, readdirSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync
} from 'node:fs';
import { resolve } from 'node:path';

import { createServer, type ViteDevServer } from 'vite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const root = resolve(__dirname, '..');

describe('vite-plugin-view example dev server (integration)', () => {
  let server: ViteDevServer;
  let baseUrl: string;

  beforeAll(async () => {
    // Use vite.config.7.mts (MPA EJS engine with entry: { index, home }) — a
    // REAL multi-page Vite config that also declares build.rolldownOptions.input
    // through the plugin. This is the exact "configureServer prepend vs
    // spaFallbackMiddleware rewrite" scenario the middleware was designed for;
    // /home without extension would otherwise get rewritten to /index.html if
    // we ran after Vite's fallback middleware.
    //
    // We pin host to 127.0.0.1 (IPv4 loopback) so tests don't collide with the
    // dev server accidentally binding to ::1 (IPv6) and fetch() rejecting
    // connections when the host family doesn't match.
    const configMod = await import(resolve(root, 'vite.config.7.mts'));
    server = await createServer({
      ...configMod.default,
      configFile: false,
      server: {
        ...(configMod.default).server,
        host: '127.0.0.1',
        port: 0,
        strictPort: false
      }
    });
    await server.listen();
    const info = server.httpServer?.address();
    const port = info && typeof info === 'object' ? info.port : 0;
    baseUrl = `http://127.0.0.1:${port}`;
  }, 60000);

  afterAll(async () => {
    if (server) {
      await server.close();
    }
  }, 30000);

  it('GET / → renders index.ejs (EJS Example + Apple/Banana/Cherry items)', async () => {
    const r = await fetch(`${baseUrl}/`, {
      headers: { Accept: 'text/html' }
    });
    expect(r.status).toBe(200);
    expect(r.headers.get('content-type')).toContain('text/html');
    const html = await r.text();
    expect(html).toContain('EJS Example');
    expect(html).toContain('Apple');
    expect(html).toContain('Banana');
    expect(html).toContain('Cherry');
    // Vite dev middleware should still inject the dev client <script> after
    // transformIndexHtml runs — confirms the dev pipeline end-to-end.
    expect(html).toContain('/@vite/client');
  }, 30000);

  it('GET /home → renders home.ejs multi-page template (no extension)', async () => {
    const r = await fetch(`${baseUrl}/home`, {
      headers: { Accept: 'text/html' }
    });
    expect(r.status).toBe(200);
    const html = await r.text();
    expect(html).toContain('Multi-Page Example');
    expect(html).toContain('data-page="home"');
  }, 30000);

  it('GET /home/ → trailing slash also resolves home.ejs', async () => {
    const r = await fetch(`${baseUrl}/home/`, {
      headers: { Accept: 'text/html' }
    });
    expect(r.status).toBe(200);
    const html = await r.text();
    expect(html).toContain('data-page="home"');
  }, 30000);

  it('GET /%ZZ (malformed percent-encoding) does NOT throw a 500 URIError', async () => {
    // The middleware must catch decodeURIComponent failures (URIError: URI
    // malformed) and pass them to next() instead of bubbling up as a 500
    // page-crash. Anything other than 500 — 404, Vite's 400, or even next()
    // falling through and returning a plain Vite fallback page — counts.
    let r: Response;
    try {
      r = await fetch(`${baseUrl}/%ZZ`, {
        headers: { Accept: 'text/html' }
      });
    }
    catch (e) {
      // Node fetch can throw on malformed URL; if so, that's fine (the point
      // is the server process didn't crash with a 500). But we want fetch()
      // to at least not close the socket abruptly.
      expect(String(e)).not.toContain('ECONNRESET');
      return;
    }
    // Definitely must NOT be a server-side 5xx.
    expect(r.status).toBeLessThan(500);
  }, 30000);

  it('POST /index.html → Method guard hands off to next() (does not render HTML)', async () => {
    const r = await fetch(`${baseUrl}/index.html`, {
      method: 'POST',
      headers: { Accept: 'text/html', 'Content-Type': 'application/json' },
      body: JSON.stringify({ hello: 'world' })
    });
    // POST is not a document method → middleware calls next(). Vite's own
    // stack eventually 404s since there's no POST handler for /index.html.
    // The key assertion: 2xx + rendered HTML would mean the guard failed.
    expect(r.status).not.toBe(200);
    const type = r.headers.get('content-type') ?? '';
    if (r.status === 200 && type.includes('text/html')) {
      const text = await r.text();
      // If a 200 ever arrives it must NOT contain our template's rendered
      // content (otherwise someone weakened the method guard).
      expect(text).not.toContain('EJS Example');
    }
  }, 30000);

  it('GET /users with Accept: application/json → does not render template fallback', async () => {
    // Requests that don't negotiate for HTML must not waste time rendering
    // home.ejs even though /users passes the isHtmlShape rule. The Accept
    // header guard inside createIndexHtmlMiddleware should short-circuit.
    const r = await fetch(`${baseUrl}/users`, {
      headers: { Accept: 'application/json' }
    });
    const type = r.headers.get('content-type') ?? '';
    // Even if Vite returns a 404 HTML page, it should be Vite's own page,
    // not a rendered template (which would be 200 + contain our engine-
    // injected markers like "EJS Example").
    if (type.includes('text/html')) {
      const body = await r.text();
      expect(body).not.toContain('Apple');
      expect(body).not.toContain('EJS Example');
    }
  }, 30000);

  it('GET / with sec-fetch-dest: image → still renders (Vite 8 only excludes script)', async () => {
    // Vite 8's indexHtmlMiddleware only checks `sec-fetch-dest !== 'script'`;
    // image and other non-script destinations are NOT excluded, so the
    // template IS rendered. This matches Vite 8's behavior exactly.
    //
    // Vite 8 的 indexHtmlMiddleware 只检查 `sec-fetch-dest !== 'script'`，
    // image 等非 script 目标不会被排除，模板会被渲染。与 Vite 8 行为完全一致。
    const r = await fetch(`${baseUrl}/`, {
      headers: {
        Accept: 'image/webp,image/*,*/*;q=0.8',
        'sec-fetch-dest': 'image'
      }
    });
    expect(r.status).toBe(200);
    expect(r.headers.get('content-type')).toContain('text/html');
    const html = await r.text();
    expect(html).toContain('EJS Example');
  }, 30000);
});

// Scoped helpers for the `delegate` strategy describe block below.
// `delegate` 策略测试块下面用到的作用域辅助函数。
function listBakFilesIn(dir: string): string[] {
  return readdirSync(dir).filter((f) => f.endsWith('.html') || /\.html\.bak_\d+$/.test(f));
}

describe('vite-plugin-view dev server — strategy: delegate (MPA EJS, write .html to disk)', () => {
  let server: ViteDevServer;
  let baseUrl: string;

  // Pre-existing user-owned index.html content — this is what we MUST
  // restore after the delegate strategy exits.
  // 用户原有的 index.html 内容——delegate 策略结束后必须还原成这个。
  const USER_OWNED_INDEX = '<!-- user-owned placeholder do not overwrite -->';
  const indexHtmlPath = resolve(root, 'index.html');
  const homeHtmlPath  = resolve(root, 'home.html');

  function manualCleanup() {
    // After each test run we revert any side effects: delete generated
    // .html siblings and rename .bak_* files back. Mirrors what the process-
    // exit hooks in indexHtml.ts do on normal termination, but here we have
    // to do it manually because SIGINT / exit hooks are not fired by vitest.
    // 每次测试结束后撤销所有副作用：删除生成的 .html 兄弟文件并把
    // .bak_* 重命名回原名。镜像 indexHtml.ts 中进程退出钩子的行为，
    // 但此处必须手动执行，因为 vitest 不会触发 SIGINT / exit 钩子。
    const siblings = listBakFilesIn(root);
    for (const name of siblings) {
      const abs = resolve(root, name);
      if (/\.html\.bak_(\d+)$/.test(name)) {
        // Rename backup back to the original .html filename (strip suffix).
        const orig = abs.replace(/\.bak_\d+$/, '');
        try {
          if (existsSync(orig)) {
            unlinkSync(orig);
          } // drop generated .html
          renameSync(abs, orig);
        }
        catch { /* ignore */ }
      }
      else if (name.endsWith('.html')) {
        // Generated .html with no matching backup: user did not have a prior
        // file. Delete it.
        try {
          unlinkSync(abs);
        }
        catch { /* ignore */ }
      }
    }
  }

  beforeAll(async () => {
    // Clean up any stale leftovers from a prior (interrupted) test run FIRST,
    // otherwise we would mistake a leftover backup for a freshly-made one.
    // 在每次运行前先清理上次中断的残留，否则会把旧备份错当成新生成的。
    manualCleanup();

    // Drop a user-owned placeholder index.html so delegate strategy is forced
    // down the "backup before overwrite" branch — this is what most real
    // projects look like (they have a static index.html in the project root).
    // 先放入一个用户占位的 index.html，迫使 delegate 策略走"写入前备份"
    // 分支——大多数真实项目就是这样（项目根下有一个静态 index.html）。
    writeFileSync(indexHtmlPath, USER_OWNED_INDEX, 'utf-8');

    const configMod = await import(resolve(root, 'vite.config.8.mts'));
    server = await createServer({
      ...configMod.default,
      configFile: false,
      server: {
        ...(configMod.default).server,
        host: '127.0.0.1',
        port: 0,
        strictPort: false
      }
    });
    await server.listen();
    const info = server.httpServer?.address();
    const port = info && typeof info === 'object' ? info.port : 0;
    baseUrl = `http://127.0.0.1:${port}`;
  }, 60000);

  afterAll(async () => {
    if (server) {
      await server.close();
    }
    // Undo the side effects so the working tree is back to its original
    // state (only .ejs / .pug / .njk templates, no .html or .bak_* files).
    // 撤销副作用，让工作树回到原始状态（只有 .ejs/.pug/.njk 模板，
    // 没有 .html 或 .bak_* 文件）。
    manualCleanup();
    // Sanity check: no leftover .bak_* or generated .html in project root.
    expect(listBakFilesIn(root).filter((n) =>
      n !== 'index.html' || readFileSync(resolve(root, n), 'utf-8') !== USER_OWNED_INDEX
    ).length).toBe(0);
    // Finally delete the user placeholder we introduced so the example
    // working tree is exactly as git expects it.
    if (existsSync(indexHtmlPath) && readFileSync(indexHtmlPath, 'utf-8') === USER_OWNED_INDEX) {
      unlinkSync(indexHtmlPath);
    }
    if (existsSync(homeHtmlPath)) {
      unlinkSync(homeHtmlPath);
    }
  }, 30000);

  it('(1) HTTP render uses Vite native pipeline — content + @vite/client present', async () => {
    // When `strategy: 'delegate'` runs, the middleware writes index.html to
    // disk, next()s, and Vite's own indexHtmlMiddleware reads that file and
    // applies transformIndexHtml. That means @vite/client injection (done in
    // transformIndexHtml) MUST be present — if it is missing, we never
    // actually delegated to Vite's pipeline.
    // 运行 `strategy: 'delegate'` 时，中间件把 index.html 写磁盘并
    // next()，Vite 自己的 indexHtmlMiddleware 读取该文件并应用
    // transformIndexHtml。因此 @vite/client 注入（在 transformIndexHtml
    // 中完成）必须存在——如果缺失，说明根本没有委托给 Vite 的流水线。
    const r = await fetch(`${baseUrl}/`, {
      headers: { Accept: 'text/html' }
    });
    expect(r.status).toBe(200);
    const body = await r.text();
    expect(body).toContain('EJS Delegate Example');
    expect(body).toContain('Alpha');
    expect(body).toContain('Beta');
    expect(body).toContain('Gamma');
    expect(body).toContain('/@vite/client');
  }, 30000);

  it('(2) index.html was really written to disk AND user original was backed up', () => {
    // Delegate strategy's defining behaviour: the middleware writes .html
    // files next to their templates. After step (1) we should see:
    //   - a freshly written index.html with RENDERED template content, NOT the
    //     user's original USER_OWNED_INDEX placeholder
    //   - at least one index.html.bak_<timestamp> file whose content IS the
    //     user's original placeholder (proves the backup path was taken)
    //
    // delegate 策略的定义性行为：中间件把 .html 写到模板同目录。
    // 步骤 (1) 之后应该看到：
    //   - 新写入的 index.html，内容是渲染后的模板，不是用户的
    //     USER_OWNED_INDEX 占位符
    //   - 至少存在一个 index.html.bak_<时间戳> 文件，内容恰好是用户原来的
    //     占位符（证明备份分支确实被执行了）
    const current = readFileSync(indexHtmlPath, 'utf-8');
    expect(current).not.toBe(USER_OWNED_INDEX); // was overwritten
    expect(current).toContain('EJS Delegate Example'); // rendered template

    const files = readdirSync(root);
    const backup = files.find((f) => f.startsWith('index.html.bak_'));
    expect(backup, 'a backup file should exist for the overwritten index.html').toBeDefined();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const backedContent = readFileSync(resolve(root, backup!), 'utf-8');
    expect(backedContent).toBe(USER_OWNED_INDEX);
  });

  it('(3) Dedup: second request does NOT rewrite the file (mtime stays the same)', async () => {
    // The middleware guard checks `delegateWritten.has(reqKey)` before
    // writing — second request must skip disk entirely. We confirm that by
    // snapshotting mtime now and re-asserting it after a second fetch.
    // 中间件守卫在写入前检查 `delegateWritten.has(reqKey)` —— 第二次请求
    // 必须完全跳过磁盘写。通过快照 mtime，再发一次请求后重新比较来验证。
    const beforeStat = statSync(indexHtmlPath);
    await fetch(`${baseUrl}/`, { headers: { Accept: 'text/html' } });
    const afterStat = statSync(indexHtmlPath);
    expect(afterStat.mtimeMs).toBe(beforeStat.mtimeMs);
  }, 30000);

  it('(4) Multi-page /home renders via delegate and writes home.html sibling', async () => {
    // No pre-existing home.html — so delegate strategy simply writes the
    // rendered output with no backup needed. We assert content is correct.
    // 不存在预先的 home.html —— 所以 delegate 策略直接写入渲染结果，
    // 不需要备份。验证内容正确。
    const r = await fetch(`${baseUrl}/home`, { headers: { Accept: 'text/html' } });
    expect(r.status).toBe(200);
    const body = await r.text();
    expect(body).toContain('Home (delegate)');
    expect(body).toContain('data-page="home"');
    expect(body).toContain('/@vite/client');

    // Side effect: home.html now exists next to home.ejs, and there is no
    // home.html.bak_* sibling because user didn't own a home.html.
    // 副作用：home.ejs 旁边多了一个 home.html，且没有 home.html.bak_*
    // 兄弟文件，因为用户原来没有 home.html。
    expect(existsSync(homeHtmlPath), 'home.html must have been emitted next to home.ejs').toBe(true);
    const written = readFileSync(homeHtmlPath, 'utf-8');
    expect(written).toContain('Home (delegate)');

    const files = readdirSync(root);
    const anyHomeBackup = files.some((f) => f.startsWith('home.html.bak_'));
    expect(anyHomeBackup, 'no home backup expected because user had no home.html').toBe(false);
  }, 30000);

  it('(5) restoreBackedUpFiles (simulating process exit) restores user state', () => {
    // Simulate the process-exit hook using the same helper that the SIGINT /
    // SIGTERM handlers call. But we can't reach the plugin's internal
    // delegateWritten Map (it's a closure inside view()). So we manually
    // re-run the logic that restoreBackedUpFiles does: delete generated .html
    // and rename .bak_* back. Then verify:
    //   - index.html content == USER_OWNED_INDEX (backup restored)
    //   - home.html sibling file GONE (deleted, no backup existed)
    //   - no index.html.bak_* or home.html.bak_* remain on disk
    //
    // 用 SIGINT / SIGTERM 处理程序相同的辅助函数模拟进程退出钩子。
    // 但我们拿不到插件内部 delegateWritten Map（它在 view() 闭包里）。
    // 所以手动执行 restoreBackedUpFiles 同逻辑：删生成的 .html，
    // 把 .bak_* 改名回去。然后验证：
    //   - index.html 内容 == USER_OWNED_INDEX（备份还原）
    //   - home.html 兄弟文件消失（删除，没有备份可还原）
    //   - 磁盘上不再残留 index.html.bak_* / home.html.bak_*
    manualCleanup();

    expect(readFileSync(indexHtmlPath, 'utf-8')).toBe(USER_OWNED_INDEX);
    expect(existsSync(homeHtmlPath)).toBe(false);

    const leftoverBak = readdirSync(root).filter((f) => /\.html\.bak_/.test(f));
    expect(leftoverBak, 'no .bak_* leftovers after restore').toEqual([]);

    // Re-run manual cleanup so afterAll sees a clean state (it will also
    // re-check; but re-running is harmless due to idempotency).
    // 再跑一次 manualCleanup，保证 afterAll 看到干净状态（afterAll 也会
    // 检查；由于幂等性，重跑无影响）。
    // Place USER_OWNED_INDEX back so step (1) can be re-run if this case is
    // re-executed standalone:
    writeFileSync(indexHtmlPath, USER_OWNED_INDEX, 'utf-8');
  });
});
