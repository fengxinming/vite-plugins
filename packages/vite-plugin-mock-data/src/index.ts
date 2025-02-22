import { isAbsolute, posix, parse, extname } from 'node:path';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { OutgoingHttpHeaders } from 'node:http';
import { glob } from 'tinyglobby';
import getRouter, { Config as SirvConfig, HTTPVersion, HTTPMethod, RouteOptions, Handler } from 'find-my-way';
import sirv, { RequestHandler, Options as SirvOptions } from 'sirv';
import { Plugin, ViteDevServer, send } from 'vite';
import { Options, RouteConfig, HandleRoute } from './typings';

export * from './typings';

function isObject<T = any>(val: T): boolean {
  return val && typeof val === 'object';
}

function toAbsolute(pth: string, cwd): string {
  return isAbsolute(pth)
    ? pth
    : posix.join(cwd || process.cwd(), pth);
}

async function getRoute(filename: string): Promise<RouteConfig | undefined> {
  let config: RouteConfig | undefined;
  switch (extname(filename)) {
    case '.js':
      config = createRequire(import.meta.url)(filename);
      break;
    case '.mjs':
      config = (await import(filename)).default;
      break;
    case '.json':
      config = JSON.parse(readFileSync(filename, 'utf-8'));
      break;
  }
  return config;
}

async function loadRoutes(dir: string, routes: RouteConfig[]): Promise<void> {
  const paths = await glob(`${dir}/**/*.{js,mjs,json}`, { absolute: true });
  const configs = await Promise.all(paths.map(getRoute));
  configs.reduce((prev, cur) => {
    if (cur) {
      prev.push(cur);
    }
    return prev;
  }, routes);
}

function sirvOptions(headers?: OutgoingHttpHeaders): SirvOptions {
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

function configureServer(
  server: ViteDevServer,
  routerOpts: SirvConfig<HTTPVersion.V1> | SirvConfig<HTTPVersion.V2> | undefined,
  routes: RouteConfig[],
  serve: RequestHandler | null,
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

        let routeConfig = route[xpath] as HandleRoute;
        if (!isObject(routeConfig)) {
          routeConfig = { handler: routeConfig };
        }

        let handler: Handler<HTTPVersion.V1> | undefined;
        let opts: RouteOptions | undefined;

        if (typeof routeConfig.file === 'string') {
          handler = (req, res) => {
            const parsedPath = parse(toAbsolute(routeConfig.file as string, cwd));
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
          handler = routeConfig.handler;
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

  if (serve) {
    server.middlewares.use(serve);
  }

  server.middlewares.use((req, res, next) => {
    (router as any).defaultRoute = () => next();
    router.lookup(req, res);
  });
}

/**
 * Provides a simple way to mock data.
 *
 * @example
 * ```js
 * import { defineConfig } from 'vite';
 * import mockData from 'vite-plugin-mock-data';
 *
 * export default defineConfig({
 *   plugins: [
 *     mockData({
 *       routes: './mock'
 *     })
 *   ]
 * });
 * ```
 *
 * @param opts Options
 * @returns a vite plugin
 */
export default function createPlugin(opts: Options): Plugin {
  const {
    isAfter,
    routerOptions,
    routes,
    assets,
    cwd = process.cwd()
  } = opts;

  const allRoutes: RouteConfig[] = [];

  return {
    name: 'vite-plugin-mock-data',

    async configureServer(server: ViteDevServer) {
      if (typeof routes === 'string') {
        await loadRoutes(toAbsolute(routes, cwd), allRoutes);
      }
      else if (Array.isArray(routes)) {
        for (const route of routes) {
          if (typeof route === 'string') {
            await loadRoutes(toAbsolute(route, cwd), allRoutes);
          }
          else {
            allRoutes.push(route);
          }
        }
      }
      else if (isObject(routes as RouteConfig)) {
        allRoutes.push(routes as RouteConfig);
      }

      let serve: RequestHandler | null = null;
      if (assets) {
        serve = sirv(
          toAbsolute(assets, cwd),
          sirvOptions(server.config.server.headers)
        );
      }

      if (allRoutes && allRoutes.length > 0) {
        return isAfter
          ? () => configureServer(server, routerOptions, allRoutes, serve, cwd)
          : configureServer(server, routerOptions, allRoutes, serve, cwd);
      }
    }
  };
}
