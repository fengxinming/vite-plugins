# vite-plugins

> `vite-plugins` is a collection of custom plugins designed to enhance the functionality of the Vite build tool.

## Plugin List

* [vite-plugin-combine](/packages/vite-plugin-combine/) - Combines multiple module files into a single target file. It supports four modes: named exports, default exports, auto exports, and no exports, and automatically generates corresponding import statements based on configuration.

* [vite-plugin-cp](/packages/vite-plugin-cp/) - A Vite plugin for copying files/directories, supporting flexible content transformations, directory structure preservation or flattening, and custom file renaming.

* [vite-plugin-external](/packages/vite-plugin-external/) - Excludes specified module dependencies from runtime code and bundled outputs.

* [vite-plugin-hook-use](/packages/vite-plugin-hook-use/) - Displays the sequence and frequency of Vite's hook function invocations.

* [vite-plugin-include-css](/packages/vite-plugin-include-css/) - Bundles all CSS into a single JavaScript file when `cssCodeSplit: false` is enabled.

* [vite-plugin-mock-data](/packages/vite-plugin-mock-data/) - Provides a simple way to mock data.

* [vite-plugin-separate-importer](/packages/vite-plugin-separate-importer/) - Converts batch imports from a source module into individual file imports from subdirectories of the source module.

* [vite-plugin-view](/packages/vite-plugin-view/) - Dynamically render pages using custom template engines instead of the static `.html` entry file.

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