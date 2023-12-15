import { Plugin } from 'vite';
/**
 * build css into individual js files instead of using css links.
 *
 * @example
 * ```js
 * import { defineConfig } from 'vite';
 * import includeCSS from 'vite-plugin-include-css';
 *
 * export default defineConfig({
 *   plugins: [
 *     includeCSS()
 *   ],
 *   build: {
 *     cssCodeSplit: false,
 *     rollupOptions: {
 *       output: {
 *         manualChunks: undefined,
 *         assetFileNames: 'assets/[name][extname]',
 *         entryFileNames: '[name].js',
 *         format: 'iife'
 *       }
 *     }
 *   }
 * });
 * ```
 *
 * @returns a vite plugin
 */
export default function createPlugin(): Plugin;
