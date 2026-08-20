---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: vite-plugins
  text: 一个包含多个自定义插件的集合，用于增强 Vite 构建工具的功能。
  tagline: 快来尝试一下吧！
  actions:
    - theme: brand
      text: 引言
      link: /zh/guide/introduction
  image:
    src: https://vitepress.dev/vitepress-logo-large.svg
    alt: vite-plugins

features:
  - title: vite-plugin-view
    icon: 🖼️
    details: "不再使用静态 `index.html` 入口文件，而是通过自定义模板引擎动态渲染页面（支持 EJS / Nunjucks / Pug 等）。"
    link: /zh/plugins/vite-plugin-view/quick-start
    linkText: 快速入门
  - title: vite-plugin-external
    icon: 🔌
    details: "将指定模块依赖从运行时代码与构建产物中排除（支持全局变量、CDN 引入、自定义 resolver）。"
    link: /zh/plugins/vite-plugin-external/quick-start
    linkText: 快速入门
  - title: vite-plugin-build-chunk
    icon: 🧱
    details: "在 Vite 主构建完成后，额外生成多种格式的 chunk 构建产物（多格式输出/二次打包场景）。"
    link: /zh/plugins/vite-plugin-build-chunk/quick-start
    linkText: 快速入门
  - title: vite-plugin-combine
    icon: 🔗
    details: "将多个模块文件合并为单个目标文件（命名导出 / 默认导出 / 自动导出 / 无导出 四种模式，自动生成 import 语句）。"
    link: /zh/plugins/vite-plugin-combine/quick-start
    linkText: 快速入门
  - title: vite-plugin-cp
    icon: 📋
    details: "功能强大的文件/目录拷贝插件，支持高级内容转换与重命名规则。"
    link: /zh/plugins/vite-plugin-cp/quick-start
    linkText: 快速入门
  - title: vite-plugin-hook-use
    icon: 🪝
    details: "输出 Vite 调用插件各 hook 函数的顺序与次数（调试/定位生命周期性能问题）。"
    link: /zh/plugins/vite-plugin-hook-use/quick-start
    linkText: 快速入门
  - title: vite-plugin-include-css
    icon: 🎨
    details: "在启用 `cssCodeSplit: false` 时，将所有 CSS 资源打包到单一 JS 文件中内联注入。"
    link: /zh/plugins/vite-plugin-include-css/quick-start
    linkText: 快速入门
  - title: vite-plugin-mock-data
    icon: 🎭
    details: "基于文件路由的简单数据 Mock 方案（dev server 专属，支持解析请求体 / 动态参数）。"
    link: /zh/plugins/vite-plugin-mock-data/quick-start
    linkText: 快速入门
  - title: vite-plugin-reverse-proxy
    icon: 🔄
    details: "将指定脚本以 `text/javascript` MIME 类型提供服务（而不是默认的 ES module MIME 类型）。"
    link: /zh/plugins/vite-plugin-reverse-proxy/quick-start
    linkText: 快速入门
  - title: vite-plugin-separate-importer
    icon: ✂️
    details: "将从单一源模块的批量导入拆分为对源模块下独立子路径 / 独立文件的分别导入（更优 tree-shaking）。"
    link: /zh/plugins/vite-plugin-separate-importer/quick-start
    linkText: 快速入门
---
