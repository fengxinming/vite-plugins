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
     * Merging into the target file.
     *
     * @default 'index.js'
     */
    target: string;
    /**
     * Transform file names
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
     * Generate the `index.d.ts` file to a specified path.
     *
     * 生成 `index.d.ts` 文件到指定路径
     */
    dts?: string;
    /**
     * Current Working Directory.
     *
     * 当前工作目录
     */
    cwd?: string;
}
export default function createPlugin(opts: Options): Plugin;
