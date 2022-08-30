const globby = require('globby');
const { isAbsolute, join, parse } = require('path');
const Router = require('find-my-way');
const { send } = require('vite');
const sirv = require('sirv');

function isObject(val) {
  return val && typeof val === 'object';
}

function sirvOptions(headers) {
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
        // eslint-disable-next-line guard-for-in
        for (const name in headers) {
          res.setHeader(name, headers[name]);
        }
      }
    }
  };
}

function configureServer(server, routerOpts, routes, serve) {
  const router = new Router(routerOpts);
  if (Array.isArray(routes)) {
    routes.forEach((route) => {
      Object.keys(route).forEach((xpath) => {
        let [methods, pathname] = xpath.split(' ');
        if (!pathname) {
          pathname = methods;
          methods = 'GET';
        }
        let handler = route[xpath];
        let file;
        if (!isObject(handler)) {
          handler = { handler };
        }
        else if ((file = handler.file)) {
          handler.handler = (req, res) => {
            file = isAbsolute(file) ? file : join(process.cwd(), file);
            const parsedPath = parse(file);
            const serve = sirv(parsedPath.dir, sirvOptions(server.config.server.headers));
            req.url = `/${parsedPath.base}`;
            serve(req, res);
          };
        }
        if (typeof handler.handler !== 'function') {
          const ret = handler.handler;
          const retType =  typeof ret;
          handler.handler = (req, res) => {
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

        router.on(
          methods.split('/'),
          pathname,
          handler.opts || {},
          handler.handler,
          handler.store
        );
      });
    });
  }

  if (serve) {
    server.middlewares.use(serve);
  }

  server.middlewares.use((req, res, next) => {
    router.defaultRoute = () => next();
    router.lookup(req, res);
  });
}

module.exports = function (opts = {}) {
  const {
    isAfter,
    router,
    assetsDir
  } = opts;
  let {
    routesDir,
    routes = []
  } = opts;

  if (isObject(routes) && !Array.isArray(routes)) {
    routes = [routes];
  }

  return {
    name: 'vite:mock-data',

    configureServer(server) {
      if (routesDir) {
        routesDir = isAbsolute(routesDir) ? routesDir : join(process.cwd(), routesDir);
        globby.sync(`${routesDir}/**/*.js`).forEach((file) => {
          delete require.cache[file];
          routes.push(require(file));
        });
      }

      let serve;
      if (assetsDir) {
        serve = sirv(
          isAbsolute(assetsDir) ? assetsDir : join(process.cwd(), assetsDir),
          sirvOptions(server.config.server.headers)
        );
      }

      return isAfter
        ? () => configureServer(server, router, routes, serve)
        : configureServer(server, router, routes, serve);
    }
  };
};
