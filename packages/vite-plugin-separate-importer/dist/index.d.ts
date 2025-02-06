import { RenderedChunk, NormalizedOutputOptions, PluginContext } from 'rollup';
export interface RenderChunkOptions {
    code: string;
    chunk?: RenderedChunk;
    outputOptions?: NormalizedOutputOptions;
    meta?: {
        chunks: Record<string, RenderedChunk>;
    };
}
export interface libConfig {
    /**
    * 待转换的库名称
    */
    name: string | string[];
    /**
     * 转换模块的函数
     */
    transformImporter?: (importer: string, libName: string, opts: RenderChunkOptions) => string;
    /**
     * 额外导入的模块
     */
    importExtra?: (importer: string, libName: string, opts: RenderChunkOptions) => string;
}
export interface Options {
    /**
     * 模块映射表
     */
    libs?: libConfig[];
}
declare function createPlugin(this: PluginContext, { libs }?: Options): {
    name: string;
    renderChunk(this: PluginContext, code: string, chunk: RenderedChunk, outputOptions: NormalizedOutputOptions, meta: {
        chunks: Record<string, RenderedChunk>;
    }): Promise<string>;
} | undefined;
export default createPlugin;
