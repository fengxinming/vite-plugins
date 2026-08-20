
::: danger This is Vite 1.x – 6.x LEGACY documentation archive / 这是 Vite 1.x – 6.x 旧版文档归档
- These pages correspond to old plugin releases: **vite-plugin-view ≤ 4.x, vite-plugin-external ≤ 7.x, vite-plugin-build-chunk ≤ 4.x, etc.**
- Bundler covered: Rollup + esbuild (the default Vite 6 and below stack). **This does NOT apply to Vite 8+ with the new Rolldown bundler**; Vite 7/8+ users, go to the current docs immediately.
- Content under this folder is frozen and unmaintained. For any new option / field, check the current docs:
  - Latest English docs: [/guide/introduction](/guide/introduction)
  - 最新中文文档：[/zh/guide/introduction](/zh/guide/introduction)
:::
# vite-plugins

> `vite-plugins` is a collection of custom plugins designed to enhance the functionality of the Vite build tool.

## Plugin List

* [vite-plugin-build-chunk (legacy)](/legacy/plugins/vite-plugin-build-chunk/quick-start) - Generate additional build artifacts (chunk files in different formats) after Vite's Rollup-based main build.

* [vite-plugin-combine (legacy)](/legacy/plugins/vite-plugin-combine/quick-start) - Combines multiple module files into a single target file. It supports four modes: named exports, default exports, auto exports, and no exports, and automatically generates corresponding import statements based on configuration.

* [vite-plugin-cp (legacy)](/legacy/plugins/vite-plugin-cp/quick-start) - A Vite plugin for copying files/directories, supporting flexible content transformations, directory structure preservation or flattening, and custom file renaming.

* [vite-plugin-external (legacy)](/legacy/plugins/vite-plugin-external/quick-start) - Excludes specified module dependencies from runtime code and bundled outputs.

* [vite-plugin-hook-use (legacy)](/legacy/plugins/vite-plugin-hook-use/quick-start) - Displays the sequence and frequency of Vite's hook function invocations (debug / optimize lifecycle).

* [vite-plugin-include-css (legacy)](/legacy/plugins/vite-plugin-include-css/quick-start) - Bundles all CSS into a single JavaScript file when `cssCodeSplit: false` is enabled.

* [vite-plugin-mock-data (legacy)](/legacy/plugins/vite-plugin-mock-data/quick-start) - Provides a simple file-route based way to mock HTTP data for the Vite dev server.

* [vite-plugin-reverse-proxy (legacy)](/legacy/plugins/vite-plugin-reverse-proxy/quick-start) - Serves specific scripts as `text/javascript` MIME type instead of the ES module MIME type.

* [vite-plugin-separate-importer (legacy)](/legacy/plugins/vite-plugin-separate-importer/quick-start) - Converts batch imports from a source module into individual file imports from subdirectories of the source module (tree-shake friendly).

* [vite-plugin-view (legacy)](/legacy/plugins/vite-plugin-view/quick-start) - Dynamically render pages using custom template engines instead of the static `.html` entry file.
