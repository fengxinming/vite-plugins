"use strict";
const node_path = require("node:path");
const node_module = require("node:module");
const node_fs = require("node:fs");
const globby = require("globby");
const getRouter = require("find-my-way");
const sirv = require("sirv");
const vite = require("vite");
var _documentCurrentScript = typeof document !== "undefined" ? document.currentScript : null;
function isObject(val) {
  return val && typeof val === "object";
}
function toAbsolute(pth, cwd) {
  return node_path.isAbsolute(pth) ? pth : node_path.posix.join(cwd || process.cwd(), pth);
}
function sirvOptions(headers) {
  return {
    dev: true,
    etag: true,
    extensions: [],
    setHeaders(res, pathname) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      if (/\.[tj]sx?$/.test(pathname)) {
        res.setHeader("Content-Type", "application/javascript");
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
function configureServer(server, routerOpts, routes, serve, cwd) {
  const router = getRouter(routerOpts);
  if (Array.isArray(routes)) {
    routes.forEach((route) => {
      Object.keys(route).forEach((xpath) => {
        let [methods, pathname] = xpath.split(" ");
        if (!pathname) {
          pathname = methods;
          methods = "GET";
        }
        let routeConfig = route[xpath];
        if (!isObject(routeConfig)) {
          routeConfig = { handler: routeConfig };
        }
        let handler;
        if (typeof routeConfig.file === "string") {
          handler = (req, res) => {
            const parsedPath = node_path.parse(toAbsolute(routeConfig.file, cwd));
            const serve2 = sirv(parsedPath.dir, sirvOptions(server.config.server.headers));
            req.url = `/${parsedPath.base}`;
            serve2(req, res);
          };
        } else if (typeof routeConfig.handler !== "function") {
          const ret = routeConfig.handler;
          const retType = typeof ret;
          handler = (req, res) => {
            vite.send(req, res, retType !== "string" ? JSON.stringify(ret) : ret, isObject(ret) ? "json" : "html", {
              headers: server.config.server.headers
            });
          };
        } else {
          handler = routeConfig.handler;
        }
        if (handler) {
          router.on(methods.split("/"), pathname, {}, handler, routeConfig.store);
        }
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
function createPlugin(opts) {
  const { isAfter, mockRouterOptions, mockAssetsDir } = opts;
  let { cwd, mockRoutesDir } = opts;
  let mockRoutes = opts.mockRoutes || [];
  if (!cwd) {
    cwd = process.cwd();
  }
  if (isObject(mockRoutes) && !Array.isArray(mockRoutes)) {
    mockRoutes = [mockRoutes];
  }
  return {
    name: "vite-plugin-mock-data",
    async configureServer(server) {
      if (mockRoutesDir) {
        mockRoutesDir = toAbsolute(mockRoutesDir, cwd);
        const paths = await globby(`${mockRoutesDir}/**/*.{js,mjs,json}`);
        await Promise.all(paths.map((file) => {
          return (async () => {
            let config;
            switch (node_path.extname(file)) {
              case ".js":
                config = node_module.createRequire(typeof document === "undefined" ? require("url").pathToFileURL(__filename).href : _documentCurrentScript && _documentCurrentScript.src || new URL("index.js", document.baseURI).href)(file);
                break;
              case ".mjs":
                config = (await import(file)).default;
                break;
              case ".json":
                config = JSON.parse(node_fs.readFileSync(file, "utf-8"));
                break;
            }
            if (config) {
              mockRoutes.push(config);
            }
          })();
        }));
      }
      let serve = null;
      if (mockAssetsDir) {
        serve = sirv(toAbsolute(mockAssetsDir, cwd), sirvOptions(server.config.server.headers));
      }
      return isAfter ? () => configureServer(server, mockRouterOptions, mockRoutes, serve, cwd) : configureServer(server, mockRouterOptions, mockRoutes, serve, cwd);
    }
  };
}
module.exports = createPlugin;
