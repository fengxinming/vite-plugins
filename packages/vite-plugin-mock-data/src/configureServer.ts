import { OutgoingHttpHeaders } from 'node:http';
import { parse } from 'node:path';

import getRouter, { Config as SirvConfig, Handler, HTTPMethod, HTTPVersion, RouteOptions } from 'find-my-way';
import { isObject } from 'is-what-type';
import sirv, { type Options as SirvOptions } from 'sirv';
import { send, ViteDevServer } from 'vite';
import { toAbsolutePath } from 'vp-runtime-helper';

import { HandleRoute, RouteConfig } from './typings';
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

  server.middlewares.use((req, res, next) => {
    (router as any).defaultRoute = () => next();
    router.lookup(req, res);
  });
}
