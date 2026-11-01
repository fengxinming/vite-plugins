# vite-plugins

> A collection of custom plugins designed to enhance the functionality of the Vite build tool.

## Plugin List

* [vite-plugin-build-chunk](/plugins/vite-plugin-build-chunk/) - Generates additional build artifacts (e.g. the same chunk in UMD/CJS/ESM formats) after Vite's main build, by running a secondary lib-mode build over a built chunk.

* [vite-plugin-combine](/plugins/vite-plugin-combine/) - Combines multiple module files into a single target file. It supports five export strategies (named, default, both, all, none) and automatically generates corresponding import statements based on configuration.

* [vite-plugin-cp](/plugins/vite-plugin-cp/) - A Vite plugin for copying files/directories, supporting flexible content transformations, directory structure preservation or flattening, and custom file renaming.

* [vite-plugin-external](/plugins/vite-plugin-external/) - Excludes specified module dependencies from runtime code and bundled outputs.

* [vite-plugin-hook-use](/plugins/vite-plugin-hook-use/) - Displays the sequence and frequency of Vite's hook function invocations.

* [vite-plugin-include-css](/plugins/vite-plugin-include-css/) - Bundles all CSS into a single JavaScript file when `cssCodeSplit: false` is enabled.

* [vite-plugin-mock-data](/plugins/vite-plugin-mock-data/) - Mocks HTTP APIs from file-based route definitions, both in the dev server and — via an injected virtual module and an axios adapter (`buildMock`) — inside the browser bundle of production builds.

* [vite-plugin-reverse-proxy](/plugins/vite-plugin-reverse-proxy/) - Serves local dev scripts under the URL of their production counterparts, so an online page (via proxy tools like XSwitch) can be debugged against the dev server.

* [vite-plugin-separate-importer](/plugins/vite-plugin-separate-importer/) - Converts batch imports from a source module into individual file imports from subdirectories of the source module.

* [vite-plugin-view](/plugins/vite-plugin-view/) - Dynamically render pages using custom template engines instead of the static `.html` entry file.

## Documentation

For detailed usage instructions and API references, please visit the official documentation:

👉 [View Full Documentation](https://fengxinming.github.io/vite-plugins/)

## Contributing

We welcome contributions from the community! If you find a bug or want to suggest an improvement, feel free to open an issue or submit a pull request.

### How to Contribute
1. Fork the repository.
2. Create a new branch for your changes.
3. Submit a pull request with a clear description of your changes.

## License

This project is licensed under the [MIT License](LICENSE).
