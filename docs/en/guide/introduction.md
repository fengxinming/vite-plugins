# vite-plugins

> `vite-plugins` is a collection of custom plugins designed to enhance the functionality of the Vite build tool.

## Plugin List

* [vite-plugin-combine](/plugins/vite-plugin-combine/quick-start) - Combines multiple module files into a single target file. It supports four modes: named exports, default exports, auto exports, and no exports, and automatically generates corresponding import statements based on configuration.

* [vite-plugin-cp](/plugins/vite-plugin-cp/quick-start) - A Vite plugin for copying files/directories, supporting flexible content transformations, directory structure preservation or flattening, and custom file renaming.

* [vite-plugin-external](/plugins/vite-plugin-external/quick-start) - Excludes specified module dependencies from runtime code and bundled outputs.

* [vite-plugin-hook-use](/plugins/vite-plugin-hook-use/quick-start) - Displays the sequence and frequency of Vite's hook function invocations.

* [vite-plugin-include-css](/plugins/vite-plugin-include-css/quick-start) - Bundles all CSS into a single JavaScript file when `cssCodeSplit: false` is enabled.

* [vite-plugin-mock-data](/plugins/vite-plugin-mock-data/quick-start) - Provides a simple way to mock data.

* [vite-plugin-separate-importer](/plugins/vite-plugin-separate-importer/quick-start) - Converts batch imports from a source module into individual file imports from subdirectories of the source module.

* [vite-plugin-view](/plugins/vite-plugin-view/quick-start) - Dynamically render pages using custom template engines instead of the static `index.html` entry file.