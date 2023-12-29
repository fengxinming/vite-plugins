import { Plugin } from 'vite';
export interface BasicOptions {
    /**
     * The current working directory in which to join `cacheDir`.
     *
     * 用于拼接 `cacheDir` 的路径。
     *
     * @default `process.cwd()`
     */
    cwd?: string;
    /**
     * Cache folder
     *
     * 缓存文件夹
     *
     * @default `${cwd}/node_modules/.vite_external`
     */
    cacheDir?: string;
    /**
     * External dependencies
     *
     * 外部依赖
     */
    externals: Record<string, any>;
}
export interface Options extends BasicOptions {
    /**
     * External dependencies for specific modes
     *
     * 针对指定的模式配置外部依赖
     */
    [mode: string]: BasicOptions | any;
    /**
     * The mode to use when resolving `externals`.
     *
     * 当配置的 `mode` 和执行 `vite` 命令时传入的 `--mode` 参数匹配时，将采用了别名加缓存的方式处理 `externals`。
     * 设置为 `false` 时，可以有效解决外部依赖对象在 `default` 属性。
     *
     * @default 'development'
     */
    mode?: string | false;
    /**
     * The value of enforce can be either `"pre"` or `"post"`, see more at https://vitejs.dev/guide/api-plugin.html#plugin-ordering.
     *
     * 强制执行顺序，`pre` 前，`post` 后，参考 https://cn.vitejs.dev/guide/api-plugin.html#plugin-ordering
     */
    enforce?: 'pre' | 'post';
    /**
     * External dependencies format
     *
     * 外部依赖以什么格式封装
     *
     * @default 'cjs'
     */
    format?: 'cjs' | 'es';
}
/**
 * provides a way of excluding dependencies from the runtime code and output bundles.
 *
 * @example
 * ```js
 * import createExternal from 'vite-plugin-external';
 *
 * export default defineConfig({
 *  plugins: [
 *    createExternal({
 *      externals: {
 *        react: 'React'
 *      }
 *    })
 *  ],
 *  build: {
 *    cssCodeSplit: false,
 *    rollupOptions: {
 *      output: {
 *        manualChunks: undefined,
 *        assetFileNames: 'assets/[name][extname]',
 *        entryFileNames: '[name].js',
 *        format: 'iife'
 *      }
 *    }
 *  }
 * });
 * ```
 *
 * @param opts options
 * @returns a vite plugin
 */
export default function createPlugin(opts: Options): Plugin;
