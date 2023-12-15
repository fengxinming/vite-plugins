export interface Options {
    /**
     * The target script to be proxied.
     */
    targets: Record<string, string>;
    /**
     * The preamble code to be injected before the main script.
     */
    preambleCode?: string;
}
/**
 * Makes the script to be served with the text/javascript MIME type instead of module MIME type.
 *
 * @example
 * ```js
 * import { defineConfig } from 'vite';
 * import reverseProxy from 'vite-plugin-reverse-proxy';
 *
 * export default defineConfig({
 *   plugins: [
 *     reverseProxy({
 *       targets: {
 *         '/app.js':'src/main.jsx'
 *       }
 *     }),
 *   ]
 * });
 * ```
 *
 * @param options Options
 * @returns a vite plugin
 */
export default function createPlugin(options: Options): {
    name: string;
    config(config: any): void;
    configResolved(config: any): void;
    load(id: any): string | undefined;
};
