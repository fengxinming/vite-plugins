import { exactRegex } from '@rolldown/pluginutils';
import { Plugin, ViteDevServer } from 'vite';
import { banner } from 'vp-runtime-helper';

import pkg from '../package.json' with { type: 'json' };
import { collectRoutes, resolveMockFiles } from './lib/collectRoutes';
import { configureServer } from './lib/configureServer';
import { PLUGIN_NAME, VIRTUAL_MOCK_ROUTES } from './lib/constants';
import { createMockRoutesSource } from './lib/createMockRoutesSource';
import { logger } from './lib/logger';
import type { Options, RouteConfig, RouteValue } from './types';

export * from './lib/constants';
export * from './types';

/**
 * Mocks API routes on the Vite dev server from a mock directory or inline route
 * config, and can expose file-based routes to the browser for built static pages.
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
    fastifyOptions = {},
    routes,
    logLevel,
    cacheDir,
    cwd = process.cwd(),
    buildMock = false
  } = opts;

  if (logLevel) {
    logger.level = logLevel;
  }

  const allRoutes: RouteConfig[] = [];

  const plugin: Plugin = {
    name: PLUGIN_NAME,

    async configureServer(server: ViteDevServer) {
      // 先清空再重建：vite 可能多次调用本 hook（dev 模式 createServer/restart、
      // 测试多次 start 复用同一插件实例）。allRoutes 是插件闭包数组，
      // 不清空会重复 push → 同一批路由注册两次 → FST_ERR_DUPLICATED_ROUTE。
      allRoutes.length = 0;

      // 必须 await：.ts/.mts mock 文件要经 oxc 转译 + 动态 import 才能拿到
      // RouteConfig，不等待就会以空路由表进入 configureServer（文件型路由全 404）。
      await collectRoutes(routes, allRoutes, cwd, cacheDir);

      return isAfter
        ? () => configureServer(server, fastifyOptions, allRoutes, cwd)
        : configureServer(server, fastifyOptions, allRoutes, cwd);
    }
  };

  if (buildMock) {
    const mockFiles = resolveMockFiles(routes, cwd);
    const mockSource = createMockRoutesSource(mockFiles, fastifyOptions);
    const resolvedVirtualModuleId = `\0${VIRTUAL_MOCK_ROUTES}`;

    if (mockFiles.length === 0) {
      logger.warn(
        'buildMock is enabled but no mock files resolved; static mock will be empty. '
              + 'Inline RouteConfig objects are dev-only and are not bundled for the static build.'
      );
    }

    plugin.resolveId = {
      filter: { id: exactRegex(VIRTUAL_MOCK_ROUTES) },
      handler() {
        return resolvedVirtualModuleId;
      }
    };
    plugin.load = {
      filter: { id: exactRegex(resolvedVirtualModuleId) },
      handler() {
        return mockSource;
      }
    };
  }

  return plugin;
}

export function defineRouteValue(value: RouteValue): RouteValue {
  return value;
}

export function defineRouteConfig(config: RouteConfig): RouteConfig {
  return config;
}

export { pluginMockData };
