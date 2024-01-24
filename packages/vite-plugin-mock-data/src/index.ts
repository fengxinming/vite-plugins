import { isAbsolute, posix, parse, extname } from 'node:path';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { OutgoingHttpHeaders } from 'node:http';
import { globby } from 'globby';
import getRouter, { Config as SirvConfig, HTTPVersion, HTTPMethod, RouteOptions, Handler } from 'find-my-way';
import sirv, { RequestHandler, Options as SirvOptions } from 'sirv';
import { Plugin, ViteDevServer, send } from 'vite';

export interface HandleRoute {
  file?: string;
  handler?: any | Handler<HTTPVersion.V1>;
  options?: RouteOptions;
  store?: any;
}

export interface RouteConfig {
  [route: string]: string | Handler<HTTPVersion.V1> | HandleRoute;
}

export interface Options {
  /**
   * The directory to serve files from.
   * @default `process.cwd()`
   */
  cwd?: string;

  /**
   * If `true`, these mock routes is matched after internal middlewares are installed.
   * @default `false`
   */
  isAfter?: boolean;

  /** Specify the directory to define mock assets. */
  mockAssetsDir?: string;

  /** Initial options of `find-my-way`. see more at https://github.com/delvedor/find-my-way#findmywayoptions */
  mockRouterOptions?: SirvConfig<HTTPVersion.V1> | SirvConfig<HTTPVersion.V2>;

  /** Initial list of mock routes that should be added to the dev server. */
  mockRoutes?: RouteConfig | RouteConfig[];

  /** Specify the directory to define mock routes that should be added to the dev server. */
  mockRoutesDir?: string;
}


function isObject(val: any): boolean {
  return val && typeof val === 'object';
}

function toAbsolute(pth: string, cwd): string {
  return isAbsolute(pth)
    ? pth
    : posix.join(cwd || process.cwd(), pth);
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
 *       mockRoutesDir: './mock'
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
    mockRouterOptions,
    mockAssetsDir
  } = opts;
  let {
    cwd,
    mockRoutesDir
  } = opts;

  let mockRoutes: RouteConfig[] = (opts.mockRoutes || []) as RouteConfig[];

  if (!cwd) {
    cwd = process.cwd();
  }

  if (isObject(mockRoutes) && !Array.isArray(mockRoutes)) {
    mockRoutes = [mockRoutes];
  }

  return {
    name: 'vite-plugin-mock-data',

    async configureServer(server: ViteDevServer) {
      if (mockRoutesDir) {
        mockRoutesDir = toAbsolute(mockRoutesDir, cwd);

        const paths = await globby(`${mockRoutesDir}/**/*.{js,mjs,json}`);
        await Promise.all(paths.map((file) => {
          return (async () => {
            let config: RouteConfig | undefined;
            switch (extname(file)) {
              case '.js':
                config = createRequire(import.meta.url)(file);
                break;
              case '.mjs':
                config = (await import(file)).default;
                break;
              case '.json':
                config = JSON.parse(readFileSync(file, 'utf-8'));
                break;
            }
            if (config) {
              mockRoutes.push(config);
            }
          })();
        }));
      }

      let serve: RequestHandler | null = null;
      if (mockAssetsDir) {
        serve = sirv(
          toAbsolute(mockAssetsDir, cwd),
          sirvOptions(server.config.server.headers)
        );
      }

      if (mockRoutes && mockRoutes.length > 0) {
        return isAfter
          ? () => configureServer(server, mockRouterOptions, mockRoutes, serve, cwd as string)
          : configureServer(server, mockRouterOptions, mockRoutes, serve, cwd as string);
      }
    }
  };
}
