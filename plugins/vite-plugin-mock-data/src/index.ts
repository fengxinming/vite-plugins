import { isObject } from 'is-what-type';
import { Plugin, ViteDevServer } from 'vite';
import { banner, toAbsolutePath } from 'vp-runtime-helper';

import pkg from '../package.json';
import { configureServer } from './configureServer';
import loadRoutes from './loadRoutes';
import { logger, PLUGIN_NAME } from './logger';
import { Options, RouteConfig } from './types';

export * from './types';


/**
 * Provides a simple way to mock data.
 *
 * @example
 * ```js
 * import { defineConfig } from 'vite';
 * import pluginMockDate from 'vite-plugin-mock-data';
 *
 * export default defineConfig({
 *   plugins: [
 *     pluginMockDate({
 *       routes: './mock'
 *     })
 *   ]
 * });
 * ```
 *
 * @param opts Options
 * @returns a vite plugin
 */
export default function pluginMockDate(opts: Options): Plugin {
  if (opts.enableBanner) {
    banner(pkg.name);
  }

  const {
    isAfter,
    routerOptions,
    routes,
    logLevel,
    cwd = process.cwd()
  } = opts;

  if (logLevel) {
    logger.level = logLevel;
  }

  const allRoutes: RouteConfig[] = [];

  return {
    name: PLUGIN_NAME,

    async configureServer(server: ViteDevServer) {
      if (typeof routes === 'string') {
        logger.debug('Load routes from', routes);
        await loadRoutes(toAbsolutePath(routes, cwd), allRoutes);
      }
      else if (Array.isArray(routes)) {
        for (const route of routes) {
          logger.debug('Load routes from', route);

          if (typeof route === 'string') {
            await loadRoutes(toAbsolutePath(route, cwd), allRoutes);
          }
          else {
            allRoutes.push(route);
          }
        }
      }
      else if (isObject<RouteConfig>(routes)) {
        logger.debug('Load routes from', routes);
        allRoutes.push(routes);
      }

      return isAfter
        ? () => configureServer(server, routerOptions, allRoutes, cwd)
        : configureServer(server, routerOptions, allRoutes, cwd);
    }
  };
}
