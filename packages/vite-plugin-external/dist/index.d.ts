import { Plugin } from 'vite';
export interface BasicOptions {
    /**
     * @default `process.cwd()`
     */
    cwd?: string;
    /**
     * @default `${cwd}/node_modules/.vite_external`
     */
    cacheDir?: string;
    externals: Record<string, any>;
}
export interface Options extends BasicOptions {
    [mode: string]: BasicOptions | any;
    /** development mode options */
    development?: BasicOptions;
    /** production mode options */
    production?: BasicOptions;
    devMode?: string;
    enforce?: 'pre' | 'post';
}
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
