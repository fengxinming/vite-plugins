import { exactRegex } from '@rolldown/pluginutils';
import type { Plugin, ViteDevServer } from 'vite';
import { banner } from 'vp-runtime-helper';

import pkg from '../package.json' with { type: 'json' };
import { collectRoutes, resolveMockFiles } from './lib/collectRoutes';
import { configureServer } from './lib/configureServer';
import { PLUGIN_NAME, VIRTUAL_MOCK_ROUTES } from './lib/constants';
import { createMockRoutesSource } from './lib/createMockRoutesSource';
import { logger } from './lib/logger';
import type { MockIn, Options, RouteConfig, RouteValue } from './types';

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
/**
 * 归一化浏览器端 mock 的注入时机。
 *
 * - `mockIn` 未配置时回退到已废弃的 `buildMock`（`true` → `'build'`，否则 `false`）；
 * - `mockIn: true` 视作 `'build'`，`mockIn: false` 保持 `false`（不注入）。
 */
function resolveMockIn(opts: Options): MockIn {
  const { mockIn } = opts;
  if (mockIn == null) {
    return opts.buildMock ? 'build' : false;
  }
  if (mockIn === true) {
    return 'build';
  }
  return mockIn;
}

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
    cwd = process.cwd()
  } = opts;

  const mockIn = resolveMockIn(opts);

  if (logLevel) {
    logger.level = logLevel;
  }

  const allRoutes: RouteConfig[] = [];
  const resolvedVirtualModuleId = `\0${VIRTUAL_MOCK_ROUTES}`;

  let resolvedBase = '';
  let mockRoutesSource = '';

  const plugin: Plugin = {
    name: PLUGIN_NAME,

    configResolved(config) {
      // 未配置插件 base（undefined / null）时跟随 Vite 的 base。
      // './' 与 '/' 最终都会归一化成 ''：空串同时适配 dev 端 `if (base)`
      // 与 client 端 `!base` 的「无前缀」语义。
      resolvedBase = (opts.base ?? config.base)
        .replace(/^\.\//, '/')
        .replace(/\/+$/, '');

      // `'client'` 是超集：build 与 serve 都注入；`'build'` 只在 `vite build` 时注入。
      const injectMock = mockIn === 'client' || config.command === mockIn;

      if (injectMock) {
        const mockFiles = resolveMockFiles(routes, cwd);
        if (mockFiles.length === 0) {
          logger.warn(
            `mockIn is "${mockIn}" but no mock files resolved; mock route table will be empty. `
              + 'Inline RouteConfig objects are dev-only and are not bundled.'
          );
        }
        mockRoutesSource = createMockRoutesSource(mockFiles, resolvedBase, fastifyOptions);
      }
      else {
        mockRoutesSource = createMockRoutesSource([], resolvedBase, fastifyOptions);
      }
    },

    async configureServer(server: ViteDevServer) {
      // 先清空再重建：vite 可能多次调用本 hook（dev 模式 createServer/restart、
      // 测试多次 start 复用同一插件实例）。allRoutes 是插件闭包数组，
      // 不清空会重复 push → 同一批路由注册两次 → FST_ERR_DUPLICATED_ROUTE。
      allRoutes.length = 0;

      // 必须 await：.ts/.mts mock 文件要经 oxc 转译 + 动态 import 才能拿到
      // RouteConfig，不等待就会以空路由表进入 configureServer（文件型路由全 404）。
      await collectRoutes(routes, allRoutes, cwd, cacheDir);

      return isAfter
        ? () => configureServer(server, fastifyOptions, allRoutes, cwd, resolvedBase)
        : configureServer(server, fastifyOptions, allRoutes, cwd, resolvedBase);
    },

    resolveId: {
      filter: { id: exactRegex(VIRTUAL_MOCK_ROUTES) },
      handler() {
        return resolvedVirtualModuleId;
      }
    },

    load: {
      filter: { id: exactRegex(resolvedVirtualModuleId) },
      handler() {
        return mockRoutesSource;
      }
    }
  };

  return plugin;
}

export function defineRouteValue(value: RouteValue): RouteValue {
  return value;
}

export function defineRouteConfig(config: RouteConfig): RouteConfig {
  return config;
}

export { pluginMockData };
