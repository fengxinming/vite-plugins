---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: vite-plugins · Legacy
  text: Historical docs for Vite 1-6 users (still running Vite ≤ 6 and plugin versions ≤ v4/v7 etc.).
  tagline: This folder is frozen and kept only for older Vite releases. Vite 8+ (Rolldown) users please use the latest docs from the top nav.
  actions:
    - theme: brand
      text: Back to latest docs
      link: /
    - theme: alt
      text: Legacy · Introduction
      link: /legacy/guide/introduction
  image:
    src: https://vitepress.dev/vitepress-logo-large.svg
    alt: vite-plugins legacy

features:
  - title: vite-plugin-view (legacy)
    icon: 🖼️
    details: "Dynamically render pages using custom template engines instead of the static `index.html` entry file (Vite 1-6 / Rollup version)."
    link: /legacy/plugins/vite-plugin-view/quick-start
    linkText: Quick start
  - title: vite-plugin-external (legacy)
    icon: 🔌
    details: "Excludes specified module dependencies from runtime code and built bundles (globals / CDN / dynamic resolvers — Vite ≤ 6 compatible)."
    link: /legacy/plugins/vite-plugin-external/quick-start
    linkText: Quick start
  - title: vite-plugin-build-chunk (legacy)
    icon: 🧱
    details: "Generate additional build artifacts (chunk files in different formats) after Vite's Rollup-based main build."
    link: /legacy/plugins/vite-plugin-build-chunk/quick-start
    linkText: Quick start
  - title: vite-plugin-combine (legacy)
    icon: 🔗
    details: "Combines multiple module files into a single target file (named / default / auto / no-export modes)."
    link: /legacy/plugins/vite-plugin-combine/quick-start
    linkText: Quick start
  - title: vite-plugin-cp (legacy)
    icon: 📋
    details: "A powerful Vite plugin for copying files / directories with advanced transformation and renaming."
    link: /legacy/plugins/vite-plugin-cp/quick-start
    linkText: Quick start
  - title: vite-plugin-hook-use (legacy)
    icon: 🪝
    details: "Displays the sequence and frequency of Vite calling its plugin hook functions."
    link: /legacy/plugins/vite-plugin-hook-use/quick-start
    linkText: Quick start
  - title: vite-plugin-include-css (legacy)
    icon: 🎨
    details: "Bundles all CSS into a single JavaScript file when `cssCodeSplit: false` is enabled."
    link: /legacy/plugins/vite-plugin-include-css/quick-start
    linkText: Quick start
  - title: vite-plugin-mock-data (legacy)
    icon: 🎭
    details: "Provides a simple, file-route based way to mock HTTP data for the Vite dev server."
    link: /legacy/plugins/vite-plugin-mock-data/quick-start
    linkText: Quick start
  - title: vite-plugin-reverse-proxy (legacy)
    icon: 🔄
    details: "Serves specific scripts as `text/javascript` MIME type instead of the ES module MIME type."
    link: /legacy/plugins/vite-plugin-reverse-proxy/quick-start
    linkText: Quick start
  - title: vite-plugin-separate-importer (legacy)
    icon: ✂️
    details: "Transforms bulk imports from a single source module into individual sub-path / file imports."
    link: /legacy/plugins/vite-plugin-separate-importer/quick-start
    linkText: Quick start
---

::: danger This is Vite 1.x – 6.x LEGACY documentation archive / 这是 Vite 1.x – 6.x 旧版文档归档
- These pages correspond to old plugin releases: **vite-plugin-view ≤ 4.x, vite-plugin-external ≤ 7.x, vite-plugin-build-chunk ≤ 4.x, etc.**
- Bundler covered: Rollup + esbuild (the default Vite 6 and below stack). **This does NOT apply to Vite 8+ with the new Rolldown bundler**; Vite 7/8+ users, go to the current docs immediately.
- Content under this folder is frozen and unmaintained. For any new option / field, check the current docs:
  - Latest English docs: [/guide/introduction](/guide/introduction)
  - 最新中文文档：[/zh/guide/introduction](/zh/guide/introduction)
:::

::: warning Route scope / 路由范围说明
- English legacy URLs live under <code>/legacy/<strong>\*</strong></code> (e.g. <code>/legacy/guide/introduction</code>, <code>/legacy/plugins/vite-plugin-view/quick-start</code>).
- 中文旧文档的 URL 前缀统一为：<code>/zh/legacy/<strong>\*</strong></code>（例如 <code>/zh/legacy/guide/introduction</code>、<code>/zh/legacy/plugins/vite-plugin-view/quick-start</code>）。
- Content under `/legacy/*` and `/zh/legacy/*` only applies to **Vite 1.x ~ 6.x (vite-plugin-view ≤ 4.x, vite-plugin-external ≤ 7.x, etc.)**.
:::
