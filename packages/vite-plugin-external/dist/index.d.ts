import { Plugin } from 'vite';
import { Options } from './typings';
export * from './typings';
/**
 * provides a way of excluding dependencies from the runtime code and output bundles.
 *
 * @example
 * ```js
 * import createExternal from 'vite-plugin-external';
 *
 * export default defineConfig({
 *  plugins: [
 *    createExternal({
 *      externals: {
 *        react: 'React'
 *      }
 *    })
 *  ],
 *  build: {
 *    cssCodeSplit: false,
 *    rollupOptions: {
 *      output: {
 *        manualChunks: undefined,
 *        assetFileNames: 'assets/[name][extname]',
 *        entryFileNames: '[name].js',
 *        format: 'iife'
 *      }
 *    }
 *  }
 * });
 * ```
 *
 * @param opts options
 * @returns a vite plugin
 */
export default function createPlugin(opts: Options): Plugin;
