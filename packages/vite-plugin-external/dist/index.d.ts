import { Plugin } from 'vite';
export interface BasicOptions {
    cwd?: string;
    cacheDir?: string;
    externals: Externals;
}
export interface Externals {
    [packageName: string]: any;
}
export interface Options extends BasicOptions {
    [mode: string]: BasicOptions | any;
    development?: BasicOptions;
    production?: BasicOptions;
    enforce?: 'pre' | 'post';
}
export default function createPlugin(opts: Options): Plugin;
