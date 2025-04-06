import { join } from 'node:path';

import type { Connect, PreviewServer, ViteDevServer } from 'vite';
import { send } from 'vite';
import { cleanUrl, FS_PREFIX, fsPathFromId, isDevServer } from 'vp-runtime-helper';

import Engine from './Engine';
import { logger } from './logger';
export function indexHtmlMiddleware(
  engine: Engine,
  root: string,
  server: ViteDevServer | PreviewServer,
): Connect.NextHandleFunction {
  const isDev = isDevServer(server);
  if (isDev) {
    server.watcher.on('change', (file) => {
      if (file.endsWith(engine.extension)) {
        const broadcaster = server.hot || server.ws;

        if (!broadcaster) {
          return;
        }

        broadcaster.send({
          type: 'full-reload',
          path: '*'
        });

        logger.info(`"${file}" has changed, reloading page...`);
      }
    });
  }

  // Keep the named function. The name is visible in debug logs via `DEBUG=connect:dispatcher ...`
  return async function viteIndexHtmlMiddleware(req, res, next) {
    if (res.writableEnded) {
      return next();
    }

    const url = req.url && cleanUrl(req.url);
    // htmlFallbackMiddleware appends '.html' to URLs
    if (url?.endsWith('.html') && req.headers['sec-fetch-dest'] !== 'script') {
      let filePath: string;
      if (isDev && url.startsWith(FS_PREFIX)) {
        filePath = decodeURIComponent(fsPathFromId(url));
      }
      else {
        filePath = join(root, decodeURIComponent(url));
      }

      const templatePath = engine.getTemplate(filePath);

      if (templatePath) {
        logger.debug(`${(req.method || 'GET').toUpperCase()} "${url}" -> "${templatePath}" (template)`);

        try {
          let html = await engine.render(templatePath);
          if (html) {
            if (isDev) {
              server.watcher.add(templatePath);
              html = await server.transformIndexHtml(url, html, req.originalUrl);
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
    }
    next();
  };
}
