import { isObject } from 'is-what-type';
import { Plugin, ViteDevServer } from 'vite';
import { banner, toAbsolutePath } from 'vp-runtime-helper';

import pkg from '../package.json' with { type: 'json' };
import { configureServer } from './configureServer';
import loadRoutes from './loadRoutes';
import { logger, PLUGIN_NAME } from './logger';
import type { Options, RouteConfig, RouteValue } from './types';

export * from './types';


/**
 * Provides a simple way to mock data.
 *
 * @example
 * ```js
 * import { defineConfig } from 'vite';
 * import pluginMockData from 'vite-plugin-mock-data';
 *
 * export default defineConfig({
 *   plugins: [
 *     pluginMockData({
 *       routes: './mock'
 *     })
 *   ]
 * });
 * ```
 *
 * @param opts Options
 * @returns a vite plugin
 */
export default function pluginMockData(opts: Options): Plugin {
  if (opts.enableBanner) {
    banner(pkg.name);
  }

  const {
    isAfter,
    fastifyOptions,
    routes,
    logLevel,
    cacheDir,
    cwd = process.cwd()
  } = opts;

  if (logLevel) {
    logger.level = logLevel;
  }

  const allRoutes: RouteConfig[] = [];

  return {
    name: PLUGIN_NAME,

    async configureServer(server: ViteDevServer) {
      // 先清空再重建：vite 可能多次调用本 hook（dev 模式 createServer/restart、
      // 测试多次 start 复用同一插件实例）。allRoutes 是插件闭包数组，
      // 不清空会重复 push → 同一批路由注册两次 → FST_ERR_DUPLICATED_ROUTE。
      allRoutes.length = 0;

      if (typeof routes === 'string') {
        logger.debug('Load routes from', routes);
        await loadRoutes(toAbsolutePath(routes, cwd), allRoutes, cwd, cacheDir);
      }
      else if (Array.isArray(routes)) {
        for (const route of routes) {
          logger.debug('Load routes from', route);

          if (typeof route === 'string') {
            await loadRoutes(toAbsolutePath(route, cwd), allRoutes, cwd, cacheDir);
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
        ? () => configureServer(server, fastifyOptions, allRoutes, cwd)
        : configureServer(server, fastifyOptions, allRoutes, cwd);
    }
  };
}

export function defineRouteValue(value: RouteValue): RouteValue {
  return value;
}

export function defineRouteConfig(config: RouteConfig): RouteConfig {
  return config;
}

export { pluginMockData };
