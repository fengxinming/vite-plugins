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
 * @param opts options
 * @returns a vite plugin
 */
export default function createPlugin(opts: Options): Plugin;
