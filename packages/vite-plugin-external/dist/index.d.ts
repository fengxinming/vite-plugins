import { Plugin } from 'vite';
import { Options } from './typings';
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
export default function pluginExternal(opts: Options): Plugin;
export * from './typings';
