import { Plugin, version } from 'vite';

import { PLUGIN_NAME } from './common/constants';
import { logger } from './common/logger';
// import past from './past';
import rollback from './rollback';
import { Options } from './typings';
import v6 from './v6';

let major: number;
if (version) {
  const [v] = version.split('.');
  major = parseInt(v, 10);
}

/**
 * provides a way of excluding dependencies from the runtime code and output bundles.
 *
 * @example
 * ```js
 * import pluginExternal from 'vite-plugin-external';
 *
 * export default defineConfig({
 *  plugins: [
 *    pluginExternal({
 *      externals: {
        jquery: '$',

        react: 'React',
        'react-dom/client': 'ReactDOM',

        vue: 'Vue'
      }
 *    })
 *  ]
 * });
 * ```
 *
 * @param opts options
 * @returns a vite plugin
 */
export default function pluginExternal(opts: Options): Plugin {
  const plugin: Plugin = {
    name: PLUGIN_NAME,
    enforce: opts.enforce
  };

  if (major >= 6 && !opts.rollback) {
    logger.name += '-v6';
    Object.assign(plugin, v6(opts));
  }
  else {
    Object.assign(plugin, rollback(opts));
  }

  // else {
  //   Object.assign(plugin, past(opts));
  // }

  return plugin;
}

export * from './typings';
