import { Plugin } from 'vite';
export interface BasicOptions {
    externals: Externals;
}
export interface Externals {
    [packageName: string]: any;
}
export interface Options extends BasicOptions {
    [mode: string]: Options | any;
    cwd?: string;
    development?: Options;
    production?: Options;
    cacheDir?: string;
    externals: Externals;
}
export default function createPlugin(opts: Options): Plugin;
