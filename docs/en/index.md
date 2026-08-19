---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: vite-plugins
  text: A collection of custom plugins designed to enhance the functionality of the Vite build tool.
  tagline: Come and give it a try!
  actions:
    - theme: brand
      text: Introduction
      link: /guide/introduction
  image:
    src: https://vitepress.dev/vitepress-logo-large.svg
    alt: vite-plugins

features:
  - title: vite-plugin-view
    icon: 🖼️
    details: "Dynamically render pages using custom template engines instead of the static `index.html` entry file."
    link: /plugins/vite-plugin-view/quick-start
    linkText: Quick start
  - title: vite-plugin-external
    icon: 🔌
    details: "Excludes specified module dependencies from runtime code and built bundles (CDN / globals / custom resolvers)."
    link: /plugins/vite-plugin-external/quick-start
    linkText: Quick start
  - title: vite-plugin-build-chunk
    icon: 🧱
    details: "Generate additional build artifacts (chunk files in different formats) after Vite's main build process."
    link: /plugins/vite-plugin-build-chunk/quick-start
    linkText: Quick start
  - title: vite-plugin-combine
    icon: 🔗
    details: "Combines multiple module files into a single target file (named / default / auto / no-export modes)."
    link: /plugins/vite-plugin-combine/quick-start
    linkText: Quick start
  - title: vite-plugin-cp
    icon: 📋
    details: "A powerful Vite plugin for copying files / directories with advanced transformation and renaming."
    link: /plugins/vite-plugin-cp/quick-start
    linkText: Quick start
  - title: vite-plugin-hook-use
    icon: 🪝
    details: "Displays the sequence and frequency of Vite calling its plugin hook functions (debug / optimize lifecycle)."
    link: /plugins/vite-plugin-hook-use/quick-start
    linkText: Quick start
  - title: vite-plugin-include-css
    icon: 🎨
    details: "Bundles all CSS into a single JavaScript file when `cssCodeSplit: false` is enabled."
    link: /plugins/vite-plugin-include-css/quick-start
    linkText: Quick start
  - title: vite-plugin-mock-data
    icon: 🎭
    details: "Provides a simple, file-route based way to mock HTTP data (dev server only, supports request body)."
    link: /plugins/vite-plugin-mock-data/quick-start
    linkText: Quick start
  - title: vite-plugin-reverse-proxy
    icon: 🔄
    details: "Serves specific scripts as `text/javascript` MIME type instead of the ES module MIME type."
    link: /plugins/vite-plugin-reverse-proxy/quick-start
    linkText: Quick start
  - title: vite-plugin-separate-importer
    icon: ✂️
    details: "Transforms bulk imports from a single source module into individual sub-path / file imports (tree-shake friendly)."
    link: /plugins/vite-plugin-separate-importer/quick-start
    linkText: Quick start
---
