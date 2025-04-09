import { EOL } from 'node:os';

import type { Plugin } from 'vite';
import { banner, colorful, getRuntimeVersion } from 'vp-runtime-helper';

import pkg from '../package.json';
import { PLUGIN_NAME } from './common/constants';
import { logger } from './common/logger';
import rollback from './rollback';
import type { Options } from './typings';
import v6 from './v6';

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
  banner(pkg.name);

  const version = getRuntimeVersion();
  colorful.green(`${EOL}Vite@${version} ${pkg.name}@${pkg.version}`);

  const plugin: Plugin = {
    name: PLUGIN_NAME,
    enforce: opts.enforce
  };

  const major = parseInt(version.split('.')[0], 10);
  if (!opts.rollback && major >= 6) {
    logger.name = `${PLUGIN_NAME}-v${major}`;
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
