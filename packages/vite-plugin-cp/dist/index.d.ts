/// <reference types="node" />
import { Plugin } from 'vite';
import { Options as GlobbyOptions } from 'globby';
export interface Target {
    /**
     * Path or glob of what to copy.
     *
     * 要复制的目录、文件或者 `globby` 匹配规则。
     */
    src: string | string[];
    /**
     * One or more destinations where to copy.
     *
     * 复制到目标目录。
     */
    dest: string;
    /**
     * Rename the file after copying.
     *
     * 复制后重命名文件。
     */
    rename?: string | ((name: string) => string);
    /**
     * Remove the directory structure of copied files, if `src` is a directory.
     *
     * 是否删除复制的文件目录结构，`src` 为目录时有效。
     */
    flatten?: boolean;
    /**
     * Options for globby. See more at https://github.com/sindresorhus/globby#options
     *
     * globby 的选项，设置 `src` 的匹配参数
     */
    globbyOptions?: GlobbyOptions;
    /**
     * Transform the file before copying.
     *
     * 复制前转换文件内容。
     */
    transform?: (buf: Buffer, matchedPath: string) => string | Buffer | Promise<string | Buffer>;
}
export interface Options {
    /**
     * Default `'closeBundle'`, vite hook the plugin should use.
     *
     * 默认 `'closeBundle'`，调用指定钩子函数时开始复制。
     */
    hook?: string;
    /**
     * The value of enforce can be either `"pre"` or `"post"`, see more at https://vitejs.dev/guide/api-plugin.html#plugin-ordering.
     *
     * 强制执行顺序，`pre` 前，`post` 后，参考 https://cn.vitejs.dev/guide/api-plugin.html#plugin-ordering
     */
    enforce?: 'pre' | 'post';
    /**
     * Options for globby. See more at https://github.com/sindresorhus/globby#options
     *
     * globby 的选项，设置 `src` 的匹配参数。
     */
    globbyOptions?: GlobbyOptions;
    /**
     * Default `process.cwd()`, The current working directory in which to search.
     *
     * 默认 `process.cwd()`，用于拼接 `src` 的路径。
     */
    cwd?: string;
    /**
     * Array of targets to copy.
     *
     * 复制文件的规则配置。
     */
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
