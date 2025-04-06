# vite-plugins

> `vite-plugins` 是一个包含多个自定义插件的集合，用于增强 Vite 构建工具的功能。

## 插件列表

* [vite-plugin-combine](/zh/plugins/vite-plugin-combine/quick-start) - 将多个模块文件合并成一个目标文件。它支持命名导出、默认导出、自动导出和无导出四种模式，并可以根据配置自动生成相应的导入语句。

* [vite-plugin-cp](/zh/plugins/vite-plugin-cp/quick-start) - 一个用于复制文件/目录，并支持灵活转换文件内容、保留或扁平化目录结构、自定义文件重命名等的Vite插件。

* [vite-plugin-external](/zh/plugins/vite-plugin-external/quick-start) - 从运行时代码和构建后的 bundles 中排除指定的模块依赖项。

* [vite-plugin-hook-use](/zh/plugins/vite-plugin-hook-use/quick-start) - 显示 `vite` 调用其钩子函数的序列和频率

* [vite-plugin-include-css](/zh/plugins/vite-plugin-include-css/quick-start) - 当启用 `cssCodeSplit: false` 时，将所有CSS打包到单个JavaScript文件中。

* [vite-plugin-mock-data](/zh/plugins/vite-plugin-mock-data/quick-start) - 提供了一种简单的方式来模拟数据。

* [vite-plugin-separate-importer](/zh/plugins/vite-plugin-separate-importer/quick-start) - 将原来从一个源模块批量导入内容变成分批从源模块下导入单个文件。

* [vite-plugin-view](/plugins/vite-plugin-view/quick-start) - 使用自定义模板引擎动态渲染页面，替代静态的 `index.html` 入口文件。