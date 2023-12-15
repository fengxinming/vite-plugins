import { Plugin } from 'vite';
/**
 * Shows the usage of the hook function of the `vite` plugin.
 *
 * @example
 * ```js
 * import { defineConfig } from 'vite';
 * import vitePluginHookUse from 'vite-plugin-hook-use';
 *
 * export default defineConfig({
 *  plugins: [
 *    vitePluginHookUse()
 *  ]
 * });
 * ```
 *
 * @returns a vite plugin
 */
export default function createPlugin(): Plugin;
