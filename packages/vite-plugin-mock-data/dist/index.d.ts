import { Plugin } from 'vite';
import { Options } from './typings';
export * from './typings';
/**
 * Provides a simple way to mock data.
 *
 * @example
 * ```js
 * import { defineConfig } from 'vite';
 * import mockData from 'vite-plugin-mock-data';
 *
 * export default defineConfig({
 *   plugins: [
 *     mockData({
 *       routes: './mock'
 *     })
 *   ]
 * });
 * ```
 *
 * @param opts Options
 * @returns a vite plugin
 */
export default function createPlugin(opts: Options): Plugin;
