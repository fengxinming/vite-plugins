import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import engineSource from 'consolidate';
import prettyHTML from 'pretty';
import { Plugin, ResolvedConfig, ViteDevServer } from 'vite';

import { Options } from './typings';

const postfixRE = /[?#].*$/;
function cleanUrl(url: string): string {
  return url.replace(postfixRE, '');
}

/**
 * Shows the usage of the hook function of the `vite` plugin.
 *
 * @example
 * ```js

 * ```
 *
 * @returns a vite plugin
 */
export default function createPlugin(opts: Options): Plugin | undefined {
  const {
    engine,
    extension,
    pretty,
    engineOptions
  } = opts || {};

  if (!engine) {
    return;
  }

  const ext = extension || `.${engine}`;
  const tplMappings = {};
  let resolvedConfig: ResolvedConfig;

  return {
    name: 'vite-plugin-view',
    enforce: opts.enforce,
    // config(userConfig) {
    //   let { build } = userConfig;
    //   if (!build) {
    //     build = {};
    //     userConfig.build = build;
    //   }
    //   let { rollupOptions } = build;
    //   if (!rollupOptions) {
    //     rollupOptions = {};
    //     build.rollupOptions = rollupOptions;
    //   }
    //   let { input } = rollupOptions;
    // },
    configResolved(config: ResolvedConfig) {
      resolvedConfig = config;
    },
    async resolveId(id: string, importer: string, opts) {
      // 标识需要加载的模板文件
      if (id.endsWith(ext)) {
        const resolved = await this.resolve(id, importer, opts);
        if (resolved) {
          const { id } = resolved;
          const virtualHTML = id.replace(ext, '.html');
          tplMappings[virtualHTML] = id;
          resolved.id = virtualHTML;
          return resolved;
        }
      }
    },
    load(id: string) {
      // 加载模板文件
      const filename = tplMappings[id];
      if (filename) {
        const tpl = engineSource[engine];
        if (!tpl) {
          return;
        }

        return tpl.render(
          readFileSync(filename, 'utf-8'),
          Object.assign({
            filename,
            cache: false,
            define: resolvedConfig.define,
            env: resolvedConfig.env
          }, engineOptions)
        ).then((html: string) => {
          // pug模板准备移除这个"pretty"属性，官方不建议使用它，
          // 我们额外增加一个"pretty"属性强行美化模板
          if (pretty) {
            html = prettyHTML(html);
          }
          return html;
        });
      }
    },
    configureServer(server: ViteDevServer) {
      const { root, appType } = resolvedConfig;
      server.middlewares.use((req, res, next) => {
        if (
          // Only accept GET or HEAD
          (req.method !== 'GET' && req.method !== 'HEAD')
          // Exclude default favicon requests
          || req.url === '/favicon.ico'
          // Require Accept: text/html or */*
          || !(
            req.headers.accept === undefined // equivalent to `Accept: */*`
            || req.headers.accept === '' // equivalent to `Accept: */*`
            || req.headers.accept.includes('text/html')
            || req.headers.accept.includes('*/*')
          )
        ) {
          return next();
        }

        const url = cleanUrl(req.url!);
        const pathname = decodeURIComponent(url);

        // .html files are not handled by serveStaticMiddleware
        // so we need to check if the file exists
        if (pathname.endsWith('.html')) {
          const filePath = join(root, pathname);
          if (fs.existsSync(filePath)) {
            debug?.(`Rewriting ${req.method} ${req.url} to ${url}`);
            req.url = url;
            return next();
          }
        }
        // trailing slash should check for fallback index.html
        else if (pathname.endsWith('/')) {
          const filePath = path.join(root, pathname, 'index.html');
          if (fs.existsSync(filePath)) {
            const newUrl = `${url}index.html`;
            debug?.(`Rewriting ${req.method} ${req.url} to ${newUrl}`);
            req.url = newUrl;
            return next();
          }
        }
        // non-trailing slash should check for fallback .html
        else {
          const filePath = path.join(root, `${pathname}.html`);
          if (fs.existsSync(filePath)) {
            const newUrl = `${url}.html`;
            debug?.(`Rewriting ${req.method} ${req.url} to ${newUrl}`);
            req.url = newUrl;
            return next();
          }
        }

        if (spaFallback) {
          debug?.(`Rewriting ${req.method} ${req.url} to /index.html`);
          req.url = '/index.html';
        }

        next();
      });
    }
  } as Plugin;
}
