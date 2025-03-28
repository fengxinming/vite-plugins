import { Plugin } from 'vite';
import { Options } from './typings';
/**
 * Copy files and directories.
 *
 * @example
 * ```js
 * import { defineConfig } from 'vite';
 * import cp from 'vite-plugin-cp';
 *
 * export default defineConfig({
 *   plugins: [
 *     cp({
 *       targets: [
 *         // copy files of './node_modules/vite/dist' to 'dist/test'
 *         { src: './node_modules/vite/dist', dest: 'dist/test' },
 *
 *         // copy files of './node_modules/vite/dist' to 'dist/test2'
 *         // and keep the directory structure of copied files
 *         { src: './node_modules/vite/dist', dest: 'dist/test2', flatten: false },
 *
 *         // copy './node_modules/vite/README.md' to 'dist'
 *         { src: './node_modules/vite/README.md', dest: 'dist' },
 *       ]
 *     })
 *   ]
 * });
 * ```
 *
 * @param opts Options
 * @returns a vite plugin
 */
export default function createPlugin(opts: Options): Plugin<any> | undefined;
