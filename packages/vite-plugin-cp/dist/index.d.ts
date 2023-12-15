/// <reference types="node" />
import { Plugin } from 'vite';
import { Options as GlobbyOptions } from 'globby';
export interface Target {
    /** Path or glob of what to copy. */
    src: string | string[];
    /** One or more destinations where to copy. */
    dest: string;
    /** Rename the file after copying. */
    rename?: string | ((name: string) => string);
    /** Remove the directory structure of copied files. */
    flatten?: boolean;
    /** Options for globby. See more at https://github.com/sindresorhus/globby#options */
    globbyOptions?: GlobbyOptions;
    /** Transform the file before copying. */
    transform?: (buf: Buffer, matchedPath: string) => string | Buffer | Promise<string | Buffer>;
}
export interface Options {
    /** Default `'closeBundle'`, vite hook the plugin should use. */
    hook?: string;
    /** It may be needed to enforce the order of the plugin or only apply at build time.  */
    enforce?: 'pre' | 'post';
    /** Options for globby. See more at https://github.com/sindresorhus/globby#options */
    globbyOptions?: GlobbyOptions;
    /** Default `process.cwd()`, The current working directory in which to search. */
    cwd?: string;
    /** Array of targets to copy. A target is an object with properties */
    targets: Target[];
}
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
export default function createPlugin(opts: Options): Plugin;
