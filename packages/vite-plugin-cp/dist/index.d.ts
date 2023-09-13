/// <reference types="node" />
import { Plugin } from 'vite';
import { Options as GlobbyOptions } from 'globby';
export interface Target {
    src: string | string[];
    dest: string;
    rename?: string | ((name: string) => string);
    flatten?: boolean;
    transform?: (buf: Buffer, matchedPath: string) => string | Buffer | Promise<string | Buffer>;
}
export interface Options {
    hook?: string;
    enforce?: 'pre' | 'post';
    globbyOptions?: GlobbyOptions;
    cwd?: string;
    targets: Target[];
}
export default function createPlugin(opts: Options): Plugin;
