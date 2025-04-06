import engineSource from 'consolidate';
import type { Plugin, ResolvedConfig, UserConfig } from 'vite';
import { banner, toAbsolutePath } from 'vp-runtime-helper';

import Engine from './Engine';
import { indexHtmlMiddleware } from './indexHtml';
import { logger, PLUGIN_NAME } from './logger';
import { Options } from './typings';

/**
 * Shows the usage of the hook function of the `vite` plugin.
 *
 * @example
 * ```js

 * ```
 *
 * @returns a vite plugin
 */
function view(opts: Options): Plugin | undefined {
  const {
    entry,
    logLevel
  } = opts;

  banner(PLUGIN_NAME);

  if (logLevel) {
    logger.level = logLevel;
  }

  let resolvedConfig: ResolvedConfig;
  let engine;
  const tpl2html = new Map<string, string>();

  return {
    name: PLUGIN_NAME,
    enforce: opts.enforce,
    config() {
      engine = new Engine(opts);

      return {
        build: {
          rollupOptions: {
            input: entry || `index${engine.extension}`
          }
        }
      } as UserConfig;
    },

    configResolved(config: ResolvedConfig) {
      resolvedConfig = config;
      engine.config = config;

      logger.debug('Entries:', config.build.rollupOptions.input);
    },

    resolveId(source: string) {
      const { extension } = engine;

      if (source.endsWith(extension)) {
        const virtualId = `${source.slice(0, source.lastIndexOf(extension))}.html`;

        tpl2html.set(virtualId, toAbsolutePath(source, resolvedConfig.root));
        return virtualId;
      }
    },

    load(id: string) {
      const resolveId = tpl2html.get(id);

      if (resolveId) {
        return engine.render(resolveId, resolvedConfig);
      }
    },

    configureServer(server) {
      return () => server.middlewares.use(indexHtmlMiddleware(engine, resolvedConfig.root, server));
    }
  } as Plugin;
}

export { engineSource, view };
