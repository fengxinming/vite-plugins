import type { Plugin, ResolvedConfig, UserConfig } from 'vite';
import { banner, toAbsolutePath } from 'vp-runtime-helper';

import { indexHtmlMiddleware } from './indexHtml';
import { logger, PLUGIN_NAME } from './logger';
import { Options } from './typings';
import View from './view';

/**
 * Shows the usage of the hook function of the `vite` plugin.
 *
 * @example
 * ```js

 * ```
 *
 * @returns a vite plugin
 */
export default function pluginView(opts: Options): Plugin | undefined {
  const {
    entry,
    logLevel
  } = opts;

  banner(PLUGIN_NAME);

  if (logLevel) {
    logger.level = logLevel;
  }

  let resolvedConfig: ResolvedConfig;
  const view = new View(opts);
  const tpl2html = new Map<string, string>();

  return {
    name: PLUGIN_NAME,
    // enforce: 'pre',
    config() {
      const config: UserConfig = {};

      if (entry) {
        config.build = {
          rollupOptions: {
            input: entry
          }
        };
      }

      return config;
    },

    configResolved(config: ResolvedConfig) {
      resolvedConfig = config;

      logger.debug('Entries:', config.build.rollupOptions.input);
    },

    resolveId(source: string) {
      const index = source.lastIndexOf(view.extension);
      if (index > -1) {
        const virtualId = `${source.slice(0, index)}.html`;

        tpl2html.set(virtualId, toAbsolutePath(source, resolvedConfig.root));
        return virtualId;
      }
    },

    load(id: string) {
      const resolveId = tpl2html.get(id);
      if (resolveId) {
        return view.render(resolveId, resolvedConfig);
      }
    },

    configureServer(server) {
      return () => server.middlewares.use(indexHtmlMiddleware(view, resolvedConfig.root, server));
    }
  } as Plugin;
}
