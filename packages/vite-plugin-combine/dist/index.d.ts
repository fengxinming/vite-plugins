import { Plugin } from 'vite';
export type TransformName = (name: string, filePath: string) => string;
export interface Options {
    /**
     * Files prepared for merging.
     *
     * 准备合并的文件
     */
    src: string | string[];
    /**
     * combine into the target file.
     *
     * 组合到目标文件
     *
     * @default 'index.js'
     */
    target: string;
    /**
     * Whether to overwrite the target file.
     *
     * 是否覆盖目标文件
     *
     * @default false
     */
    overwrite?: boolean;
    /**
     * Transform file names.
     *
     * 转换文件名
     */
    transformName?: TransformName | boolean;
    /**
     * Exported module types.
     *
     * 导出的模块类型
     *
     * @default 'named'
     */
    exports?: 'named' | 'default' | 'none';
    /**
     * The value of enforce can be either `"pre"` or `"post"`, see more at https://vitejs.dev/guide/api-plugin.html#plugin-ordering.
     *
     * 强制执行顺序，`pre` 前，`post` 后，参考 https://cn.vitejs.dev/guide/api-plugin.html#plugin-ordering。
     */
    enforce?: 'pre' | 'post';
    /**
     * Current Working Directory.
     *
     * 当前工作目录
     */
    cwd?: string;
}
export default function createPlugin(opts: Options): Plugin;
