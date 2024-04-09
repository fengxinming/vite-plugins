import { Options as CamelCaseOptions } from 'camelcase';
import { Plugin } from 'vite';
export type CamelCase = CamelCaseOptions;
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
     * Configuration for the camelcase function.
     * https://github.com/sindresorhus/camelcase?tab=readme-ov-file#camelcaseinput-options
     *
     * camelcase 函数的配置
     */
    camelCase?: CamelCaseOptions;
    /**
     * Exported module types.
     *
     * 导出的模块类型
     *
     * @default 'named'
     */
    exports?: 'named' | 'default' | 'none';
    /**
     * Whether to generate `.d.ts` files.
     *
     * 是否生成 d.ts 文件
     *
     * @default false
     */
    dts?: boolean;
    /**
     * Current Working Directory.
     *
     * 当前工作目录
     */
    cwd?: string;
}
export default function createPlugin(opts: Options): Plugin;
