export interface Options {
  /**
   * 指定模版引擎名称
   *
   * Specify the template engine name
   */
  engine: string;

  /**
   * 强制执行顺序，`pre` 前，`post` 后，参考 https://cn.vitejs.dev/guide/api-plugin.html#plugin-ordering。
   *
   * The value of enforce can be either `"pre"` or `"post"`, see more at https://vitejs.dev/guide/api-plugin.html#plugin-ordering.
   *
   */
  enforce?: 'pre' | 'post';

  /**
   * 用于处理指定扩展名的文件，默认跟引擎名称保持一致
   */
  extension?: string;

  /**
   * 模版引擎配置
   *
   * Template engine configuration
   */
  engineOptions?: Record<string, any>;

  /**
   * 强制美化代码，一些模版引擎可能不建议在渲染时美化(如：pug)或不支持美化，使用此参数在完成渲染后再美化HTML代码
   *
   * Force beautify code
   */
  pretty?: boolean;
}
