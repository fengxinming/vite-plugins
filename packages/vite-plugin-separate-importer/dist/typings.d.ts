export interface ImportSource {
    es: string;
    cjs?: string;
}
/**
 * 插件配置接口，用于定义待转换的库名称及其处理逻辑
 * Interface for plugin configuration to define the library names and processing logic
 */
export interface libConfig {
    /**
     * 待转换的库名称，可以是单个字符串或字符串数组
     * Library name(s) to be transformed, can be a single string or an array of strings
     */
    name: string | string[];
    /**
     * 模块的新路径
     * New path for the module
     */
    importerSource?: (importer: string, libName: string) => string | ImportSource;
    /**
     * 插入导入声明
     * Insert import source
     */
    insertImport?: (importer: string, libName: string) => string | Array<string | ImportSource>;
}
export interface Options {
    /**
      * 待转换的模块配置
      * Module configuration to be converted
      */
    libs?: libConfig[];
}
