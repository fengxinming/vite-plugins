import type { ServerResponse } from 'node:http';
import { join, sep } from 'node:path';

import type { Connect, PreviewServer, ViteDevServer } from 'vite';
import { isFileLoadingAllowed, normalizePath, send } from 'vite';
import { cleanUrl, FS_PREFIX, fsPathFromId, isDevServer } from 'vp-runtime-helper';

import Engine from './Engine';
import { logger } from './logger';

/**
 * True when `filePath` is inside `root` (including being exactly `root`).
 * Mirrors Vite's internal `isParentDirectory` which is not part of the public
 * export surface. Used in preview-mode to forbid directory-traversal requests.
 *
 * filePath/root must be already normalizePath'd.
 */
function isParentDirectory(root: string, filePath: string): boolean {
  const normalizedRoot = root.endsWith(sep) ? root : `${root}${sep}`;
  return filePath === root || filePath.startsWith(normalizedRoot);
}

/**
 * Emit a minimal 403 Forbidden response (used when the filesystem access
 * guard rejects a path). We intentionally do not leak the on-disk path back
 * to the client.
 */
function respondWithAccessDenied(
  res: ServerResponse,
  server: ViteDevServer | PreviewServer,
): void {
  const isDev = isDevServer(server);
  const headers = isDev
    ? server.config.server.headers
    : server.config.preview.headers;
  if (headers) {
    for (const [k, v] of Object.entries(headers)) {
      if (v !== undefined && v !== null) {
        res.setHeader(k, v);
      }
    }
  }
  res.statusCode = 403;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end('403 Forbidden');
}

/**
 * Destinations that make sense to send a rendered HTML page to. Mirrors
 * Vite's own whitelist in `indexHtmlMiddleware` (bundledDev branch).
 * Anything outside this set (image/style/worker/audio/video/...) is not a
 * document-like request and must not trigger template rendering.
 */
const DOC_DEST = new Set<string | undefined>([
  'document',
  'iframe',
  'frame',
  'fencedframe',
  '',
  undefined
]);

/**
 * Build the index-html middleware function (without registering it). Exposed
 * for unit tests that want to invoke the middleware directly with synthetic
 * req/res/next triples.
 *
 * 构造 index-html 中间件函数（不注册）。导出给单测，方便用合成的
 * req/res/next 三元组直接调用。
 */
export function createIndexHtmlMiddleware(
  engine: Engine,
  root: string,
  server: ViteDevServer | PreviewServer,
): Connect.NextHandleFunction {
  const isDev = isDevServer(server);

  if (isDev) {
    const onChange = (file: string) => {
      if (file.endsWith(engine.extension)) {
        const broadcaster = server.hot || (server).ws;

        if (!broadcaster) {
          return;
        }

        broadcaster.send({
          type: 'full-reload',
          path: '*'
        });

        logger.info(`"${file}" has changed, reloading page...`);
      }
    };

    server.watcher.on('change', onChange);

    // Best-effort cleanup when the server shuts down so repeated
    // installIndexHtmlMiddleware calls don't accumulate listeners.
    const httpServer = (server).httpServer;
    if (httpServer) {
      const cleanup = () => {
        server.watcher.off('change', onChange);
        httpServer.off('close', cleanup);
      };
      httpServer.once('close', cleanup);
    }
  }

  // Keep the named function. The name is visible in debug logs via `DEBUG=connect:dispatcher ...`
  return async function viteIndexHtmlMiddleware(req, res, next) {
    if (res.writableEnded) {
      return next();
    }

    const rawUrl = req.url && cleanUrl(req.url);
    if (!rawUrl) {
      return next();
    }

    // Decode the URL early so downstream comparisons work against the real
    // path. Vite wraps decodeURIComponent in try/catch because malformed
    // sequences (e.g. %ZZ) throw URIError; we simply pass to next() on
    // failure (Connect's error middleware layer then handles it).
    let url: string;
    try {
      url = decodeURIComponent(rawUrl);
    }
    catch {
      return next();
    }

    // Request-kind guard (matches Vite's htmlFallbackMiddleware):
    //   - only GET / HEAD methods are document requests
    //   - /favicon.ico is a special browser ping that never returns HTML
    //   - Accept must be absent / empty / contain "text/html" or "*/*"
    // This prevents JSON API endpoints (`POST /api/list`,
    // `Accept: application/json`) from doing pointless disk IO for templates.
    const method = (req.method || 'GET').toUpperCase();
    if (
      (method !== 'GET' && method !== 'HEAD')
      || url === '/favicon.ico'
    ) {
      return next();
    }
    const accept = req.headers.accept;
    if (
      accept !== undefined
      && accept !== ''
      && !accept.includes('text/html')
      && !accept.includes('*/*')
    ) {
      return next();
    }

    // Strip trailing slashes for non-root paths, so "/home/" → "/home"
    // NOTE: the root "/" is deliberately left alone here; it ends up as a
    // no-extension URL below and gets normalised to "index.html" by the
    // `url.replace(/^\//, '')` step at the bottom of the resolution block.
    if (url.length > 1 && url.endsWith('/')) {
      url = url.slice(0, -1);
    }

    // Only handle URL shapes that semantically map to an HTML entry:
    //   - "/"           (root, will be resolved to index.html below)
    //   - "*.html"      (explicit .html request)
    //   - "/path"       (no extension and not a Vite-internal /@... request)
    // Anything else (e.g. /vite/client, /@fs/...) falls through to Vite.
    //
    // 只处理语义上对应 HTML 入口的 URL：
    //   - "/"           (根路径，后续会解析为 index.html)
    //   - "*.html"      (显式 .html 请求)
    //   - "/path"       (无扩展名且不是 Vite 内部 /@... 请求)
    // 其他（/vite/client、/@fs/... 等）交给 Vite。
    const isHtmlShape
      = url === '/'
      || url === ''
      || url.endsWith('.html')
      || (!url.includes('.') && !url.startsWith('/@'));
    if (!isHtmlShape) {
      return next();
    }

    // Document-destination guard (stricter than the old "!= script" check):
    // only browser-initiated document fetches get a rendered page. Anything
    // else (sec-fetch-dest: image / style / worker / ...) is transparently
    // handed to Vite's other middlewares.
    const secFetchDest = req.headers['sec-fetch-dest'];
    if (!DOC_DEST.has(secFetchDest)) {
      return next();
    }

    // Resolve the url to a candidate .html path, then let Engine.getTemplate
    // swap .html → .<engine> and check existence on disk.
    // 把 url 解析成候选 .html 路径，再用 Engine.getTemplate 把
    // .html → .<engine> 替换并检查磁盘存在性。
    let rel: string;
    if (url === '' || url === '/') {
      rel = 'index.html';
    }
    else if (isDev && url.startsWith(FS_PREFIX)) {
      // Absolute /@fs/... style request: fsPathFromId strips the prefix.
      try {
        rel = decodeURIComponent(fsPathFromId(url));
      }
      catch {
        return next();
      }
    }
    else {
      let decodedRel;
      try {
        decodedRel = decodeURIComponent(url.replace(/^\//, ''));
      }
      catch {
        return next();
      }
      rel = decodedRel;
      if (!rel.endsWith('.html')) {
        rel += '.html';
      }
    }

    const joined = rel.startsWith('/') || /^[A-Za-z]:[\\/]/.test(rel)
      ? rel
      : join(root, rel);
    const filePath = normalizePath(joined);

    // Filesystem access guard — mirrors the two checks Vite applies in its
    // own indexHtmlMiddleware:
    //   - Dev mode:   isFileLoadingAllowed honours server.fs.{strict,allow,deny}.
    //                 If the resolved config doesn't have the full computed
    //                 fs block (incomplete fixtures in tests / third-party
    //                 wrappers), we fall back to the same isParentDirectory
    //                 check used by preview mode so at least directory
    //                 traversal is blocked.
    //   - Preview mode: isParentDirectory ensures filePath stays inside root
    if (isDev) {
      let allowed;
      try {
        allowed = isFileLoadingAllowed(server.config, filePath);
      }
      catch {
        allowed = isParentDirectory(normalizePath(root), filePath);
      }
      if (!allowed) {
        return respondWithAccessDenied(res, server);
      }
    }
    else if (!isParentDirectory(normalizePath(root), filePath)) {
      return next();
    }

    const templatePath = engine.getTemplate(filePath);

    if (templatePath) {
      logger.debug(`${(req.method || 'GET').toUpperCase()} "${req.url}" -> "${templatePath}" (template)`);

      try {
        let html = await engine.render(templatePath);
        if (html) {
          if (isDev) {
            server.watcher.add(templatePath);
            html = await server.transformIndexHtml(req.url || url, html, req.originalUrl);
          }

          const headers = isDev
            ? server.config.server.headers
            : server.config.preview.headers;

          return send(req, res, html, 'html', { headers });
        }
      }
      catch (e) {
        return next(e);
      }
    }
    next();
  };
}

/**
 * Register the index-html middleware so it runs BEFORE Vite's built-in
 * spaFallbackMiddleware.
 *
 * Why prepend instead of append?
 *   Vite's `spaFallbackMiddleware` rewrites any non-existent `.html` URL to
 *   `/index.html` (single-page-app fallback). If our middleware is appended
 *   to the stack, it runs AFTER spaFallback and only ever sees `/index.html`
 *   — so multi-page templates like `/home.html` never reach us and 404.
 *
 *   Prepending ensures we see the ORIGINAL url first; we render the matching
 *   template (or fall through to next() when no template exists, letting Vite
 *   handle 404s and static assets normally).
 *
 * 为什么用 prepend 而不是 append？
 *   Vite 的 `spaFallbackMiddleware` 会把任何不存在的 `.html` URL 改写成
 *   `/index.html`（单页应用 fallback）。如果我们的中间件是 append，
 *   就在 spaFallback 之后跑，只能看到 `/index.html`——所以像 `/home.html`
 *   这种多页面模板请求根本到不了我们这里，直接 404。
 *
 *   Prepend 保证我们先看到 ORIGINAL url；如果对应的模板存在就渲染，
 *   不存在就 next()，让 Vite 自己处理 404 和静态资源。
 */
export function installIndexHtmlMiddleware(
  engine: Engine,
  root: string,
  server: ViteDevServer | PreviewServer,
): void {
  const middleware = createIndexHtmlMiddleware(engine, root, server);
  // PREPEND to the middleware stack so we run before spaFallbackMiddleware.
  // unshift 到中间件栈最顶端，保证在 spaFallbackMiddleware 之前跑。
  (server.middlewares as any).stack.unshift({ route: '', handle: middleware });
}
