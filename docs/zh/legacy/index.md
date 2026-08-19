---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: vite-plugins · 旧版归档
  text: 兼容 Vite 1-6 的历史文档（Vite 7 及以下用户请使用这里的配置与版本）。
  tagline: 本目录内容不再维护，将随旧版本号保留；Vite 8+ / Rolldown 用户请返回顶部导航使用最新文档。
  actions:
    - theme: brand
      text: 查看新文档首页
      link: /zh/
    - theme: alt
      text: 旧文档 · 引言
      link: /zh/legacy/guide/introduction
  image:
    src: https://vitepress.dev/vitepress-logo-large.svg
    alt: vite-plugins legacy

features:
  - title: vite-plugin-view（旧版）
    icon: 🖼️
    details: "不再使用静态 `index.html` 入口文件，而是通过自定义模板引擎动态渲染页面（Vite 1-6 / Rollup 版本）。"
    link: /zh/legacy/plugins/vite-plugin-view/quick-start
    linkText: 快速入门
  - title: vite-plugin-external（旧版）
    icon: 🔌
    details: "将指定模块依赖从运行时代码与构建产物中排除（全局变量 / CDN / 动态函数判断 —— 兼容 Vite ≤ 6）。"
    link: /zh/legacy/plugins/vite-plugin-external/quick-start
    linkText: 快速入门
  - title: vite-plugin-build-chunk（旧版）
    icon: 🧱
    details: "在基于 Rollup 的 Vite 主构建完成后，额外生成多种格式的 chunk 构建产物。"
    link: /zh/legacy/plugins/vite-plugin-build-chunk/quick-start
    linkText: 快速入门
  - title: vite-plugin-combine（旧版）
    icon: 🔗
    details: "将多个模块文件合并为单个目标文件（命名导出 / 默认导出 / 自动导出 / 无导出 四种模式）。"
    link: /zh/legacy/plugins/vite-plugin-combine/quick-start
    linkText: 快速入门
  - title: vite-plugin-cp（旧版）
    icon: 📋
    details: "功能强大的文件 / 目录拷贝插件，支持高级内容转换与重命名规则。"
    link: /zh/legacy/plugins/vite-plugin-cp/quick-start
    linkText: 快速入门
  - title: vite-plugin-hook-use（旧版）
    icon: 🪝
    details: "输出 Vite 调用插件各 hook 函数的顺序与次数（调试/定位生命周期性能问题）。"
    link: /zh/legacy/plugins/vite-plugin-hook-use/quick-start
    linkText: 快速入门
  - title: vite-plugin-include-css（旧版）
    icon: 🎨
    details: "在启用 `cssCodeSplit: false` 时，将所有 CSS 资源打包到单一 JS 文件中内联注入。"
    link: /zh/legacy/plugins/vite-plugin-include-css/quick-start
    linkText: 快速入门
  - title: vite-plugin-mock-data（旧版）
    icon: 🎭
    details: "基于文件路由的简单数据 Mock 方案（dev server 专属，支持解析请求体 / 动态参数）。"
    link: /zh/legacy/plugins/vite-plugin-mock-data/quick-start
    linkText: 快速入门
  - title: vite-plugin-reverse-proxy（旧版）
    icon: 🔄
    details: "将指定脚本以 `text/javascript` MIME 类型提供服务（而不是默认的 ES module MIME 类型）。"
    link: /zh/legacy/plugins/vite-plugin-reverse-proxy/quick-start
    linkText: 快速入门
  - title: vite-plugin-separate-importer（旧版）
    icon: ✂️
    details: "将从单一源模块的批量导入拆分为对源模块下独立子路径 / 独立文件的分别导入（更优 tree-shaking）。"
    link: /zh/legacy/plugins/vite-plugin-separate-importer/quick-start
    linkText: 快速入门
---

::: danger 这是 Vite 1.x – 6.x 旧版文档归档 / This is Vite 1.x – 6.x LEGACY archive
- 本文档对应插件版本：**vite-plugin-view ≤ 4.x、vite-plugin-external ≤ 7.x、vite-plugin-build-chunk ≤ 4.x 等旧发行版**。
- 适用打包器：Rollup / esbuild（Vite 6 及之前的默认组合）。**不支持 Vite 8+ 的 Rolldown 打包器**，Vite 7/8+ 用户请立即返回新文档。
- 本目录内容已冻结，不再维护。遇到新功能/新字段请查看最新文档：
  - 中文新文档：<a href="/zh/plugins/">/zh/plugins/</a>
  - English new docs：<a href="/plugins/">/plugins/</a>
:::

::: warning 路由范围说明 / Route scope
- 中文旧文档的 URL 前缀统一为：<code>/zh/legacy/<strong>\*</strong></code>（例如 <code>/zh/legacy/guide/introduction</code>、<code>/zh/legacy/plugins/vite-plugin-view/quick-start</code>）。
- English legacy URLs live under：<code>/legacy/<strong>\*</strong></code>（e.g. <code>/legacy/guide/introduction</code>、<code>/legacy/plugins/vite-plugin-view/quick-start</code>）。
- Content under `/zh/legacy/*` and `/legacy/*` only applies to **Vite 1.x ~ 6.x (vite-plugin-view ≤ 4.x, vite-plugin-external ≤ 7.x, etc.)**.
:::
