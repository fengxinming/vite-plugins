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

  it('GET / with sec-fetch-dest: image → skips document rendering', async () => {
    // Browsers send sec-fetch-dest: image for <img src="/"> requests etc.
    // Our middleware whitelist only contains document/iframe/frame/fencedframe.
    const r = await fetch(`${baseUrl}/`, {
      headers: {
        Accept: 'image/webp,image/*,*/*;q=0.8',
        'sec-fetch-dest': 'image'
      }
    });
    // Middleware should call next(). Vite static middleware has no / image
    // → 404. If somehow a 200 with text/html comes back it would mean the
    // sec-fetch-dest whitelist was bypassed.
    const type = r.headers.get('content-type') ?? '';
    if (type.includes('text/html') && r.status === 200) {
      const html = await r.text();
      expect(html).not.toContain('EJS Example');
    }
  }, 30000);
});
