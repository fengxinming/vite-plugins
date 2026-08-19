
::: danger 这是 Vite 1.x – 6.x 旧版文档归档 / This is Vite 1.x – 6.x legacy archive
- 本文档对应插件版本：**vite-plugin-view ≤ 4.x、vite-plugin-external ≤ 7.x、vite-plugin-build-chunk ≤ 4.x 等旧发行版**。
- 适用打包器：Rollup / esbuild（Vite 6 及之前的默认组合）。**不支持 Vite 8+ 的 Rolldown 打包器**，Vite 7/8+ 用户请立即返回新文档。
- 本目录内容已冻结，不再维护。遇到新功能/新字段请查看最新文档：
  - 中文新文档：<a href="/zh/plugins/">/zh/plugins/</a>
  - English new docs：<a href="/plugins/">/plugins/</a>
:::
# vite-plugins

> `vite-plugins` 是一个包含多个自定义插件的集合，用于增强 Vite 构建工具的功能。

## 插件列表

* [vite-plugin-build-chunk（旧版）](/zh/legacy/plugins/vite-plugin-build-chunk/quick-start) - 在基于 Rollup 的 Vite 主构建完成后，额外生成多种格式的 chunk 构建产物。

* [vite-plugin-combine（旧版）](/zh/legacy/plugins/vite-plugin-combine/quick-start) - 将多个模块文件合并成一个目标文件。它支持命名导出、默认导出、自动导出和无导出四种模式，并可以根据配置自动生成相应的导入语句。

* [vite-plugin-cp（旧版）](/zh/legacy/plugins/vite-plugin-cp/quick-start) - 一个用于复制文件/目录，并支持灵活转换文件内容、保留或扁平化目录结构、自定义文件重命名等的 Vite 插件。

* [vite-plugin-external（旧版）](/zh/legacy/plugins/vite-plugin-external/quick-start) - 从运行时代码和构建后的 bundles 中排除指定的模块依赖项。

* [vite-plugin-hook-use（旧版）](/zh/legacy/plugins/vite-plugin-hook-use/quick-start) - 显示 `vite` 调用其钩子函数的序列和频率（调试/定位生命周期性能问题）。

* [vite-plugin-include-css（旧版）](/zh/legacy/plugins/vite-plugin-include-css/quick-start) - 当启用 `cssCodeSplit: false` 时，将所有 CSS 打包到单个 JavaScript 文件中。

* [vite-plugin-mock-data（旧版）](/zh/legacy/plugins/vite-plugin-mock-data/quick-start) - 提供了基于文件路由的简单数据 Mock 方案（dev server 专属，支持解析请求体 / 动态参数）。

* [vite-plugin-reverse-proxy（旧版）](/zh/legacy/plugins/vite-plugin-reverse-proxy/quick-start) - 将指定脚本以 `text/javascript` MIME 类型提供服务（而不是默认的 ES module MIME 类型）。

* [vite-plugin-separate-importer（旧版）](/zh/legacy/plugins/vite-plugin-separate-importer/quick-start) - 将原来从一个源模块批量导入内容变成分批从源模块下导入单个文件（更优 tree-shaking）。

* [vite-plugin-view（旧版）](/zh/legacy/plugins/vite-plugin-view/quick-start) - 使用自定义模板引擎动态渲染页面，替代静态的 `.html` 入口文件。