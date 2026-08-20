import { IncomingMessage, OutgoingHttpHeaders, ServerResponse } from 'node:http';
import { parse } from 'node:path';

import getRouter, { Config as SirvConfig, Handler, HTTPMethod, HTTPVersion, RouteOptions } from 'find-my-way';
import { isObject } from 'is-what-type';
import sirv, { type Options as SirvOptions } from 'sirv';
import { send, ViteDevServer } from 'vite';
import { toAbsolutePath } from 'vp-runtime-helper';

import { HandleRoute, RouteConfig } from './types';

/**
 * Simple request body parser for JSON / urlencoded payloads.
 * Populates `req.body` so that route handlers can read it directly,
 * matching the documented handler signature `(req) => req.body`.
 */
function readJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) {
        resolve(undefined);
        return;
      }
      const type = (req.headers['content-type'] || '').toLowerCase();
      try {
        if (type.includes('application/json')) {
          resolve(JSON.parse(raw));
        }
        else if (type.includes('application/x-www-form-urlencoded')) {
          const out: Record<string, string> = {};
          for (const [k, v] of new URLSearchParams(raw)) {
            out[k] = v;
          }
          resolve(out);
        }
        else {
          resolve(raw);
        }
      }
      catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function sendResult(
  req: IncomingMessage,
  res: ServerResponse,
  ret: unknown,
  defaultHeaders: OutgoingHttpHeaders | undefined
) {
  if (res.headersSent || ret === undefined) {
    return;
  }
  send(
    req,
    res,
    typeof ret !== 'string' ? JSON.stringify(ret) : ret,
    isObject(ret) ? 'json' : 'html',
    { headers: defaultHeaders }
  );
}
export function sirvOptions(headers?: OutgoingHttpHeaders): SirvOptions {
  return {
    dev: true,
    etag: true,
    extensions: [],
    setHeaders(res, pathname) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      if (/\.[tj]sx?$/.test(pathname)) {
        res.setHeader('Content-Type', 'application/javascript');
      }
      if (headers) {
        Object.entries(headers).forEach(([key, val]) => {
          if (val) {
            res.setHeader(key, val);
          }
        });
      }
    }
  };
}

export function configureServer(
  server: ViteDevServer,
  routerOpts: SirvConfig<HTTPVersion.V1> | SirvConfig<HTTPVersion.V2> | undefined,
  routes: RouteConfig[],
  cwd: string
) {
  const router = getRouter(routerOpts);
  if (Array.isArray(routes)) {
    routes.forEach((route) => {
      Object.keys(route).forEach((xpath) => {
        let [methods, pathname] = xpath.split(' ');
        if (!pathname) {
          pathname = methods;
          methods = 'GET';
        }
        methods = methods.toUpperCase();

        let routeConfig = route[xpath] as HandleRoute;
        if (!isObject(routeConfig)) {
          routeConfig = { handler: routeConfig };
        }

        let handler: Handler<HTTPVersion.V1> | undefined;
        let opts: RouteOptions | undefined;

        if (typeof routeConfig.file === 'string') {
          handler = (req, res) => {
            const parsedPath = parse(toAbsolutePath(routeConfig.file as string, cwd));
            const serve = sirv(parsedPath.dir, sirvOptions(server.config.server.headers));
            req.url = `/${parsedPath.base}`;
            serve(req, res);
          };
        }
        else if (typeof routeConfig.handler !== 'function') {
          const ret = routeConfig.handler;
          const retType =  typeof ret;
          handler = (req, res) => {
            send(
              req,
              res,
              retType !== 'string' ? JSON.stringify(ret) : ret,
              isObject(ret) ? 'json' : 'html',
              {
                headers: server.config.server.headers
              }
            );
          };
        }
        else {
          // Handler is a user-defined function. Wrap it so that:
          //   - JSON / urlencoded request bodies are parsed into `req.body`;
          //   - find-my-way route params are exposed as `req.params`;
          //   - the handler's return value is auto-sent as JSON;
          //   - async handlers are awaited;
          //   - any thrown error becomes a 500 response.
          const userHandler = routeConfig.handler;
          const methodsList = methods.toUpperCase().split('/');
          const needsBody = methodsList.some((m) =>
            ['POST', 'PUT', 'PATCH', 'DELETE'].includes(m)
          );
          handler = async (req: any, res, params: any) => {
            req.params = params ?? {};
            try {
              if (needsBody) {
                req.body = await readJsonBody(req);
              }
            }
            catch (e) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Invalid request body', detail: String(e) }));
              return;
            }
            try {
              const ret = await userHandler(req, res);
              sendResult(req, res, ret, server.config.server.headers);
            }
            catch (e) {
              server.config.logger.error(`[mock-data] handler error on ${methods} ${pathname}: ${e}`);
              if (!res.headersSent) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Mock handler error', detail: String(e) }));
              }
            }
          };
        }

        if (handler) {
          router.on(
            methods.split('/') as HTTPMethod[],
            pathname,
            opts || {},
            handler,
            routeConfig.store
          );
        }
      });
    });
  }

  server.middlewares.use((req, res, next) => {
    (router as any).defaultRoute = () => next();
    router.lookup(req, res);
  });
}
