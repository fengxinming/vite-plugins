# vite-plugins

> `vite-plugins` is a collection of custom plugins designed to enhance the functionality of the Vite build tool.

## [中文](./README_zh-CN.md) | English

## Plugin List

### [vite-plugin-combine](packages/vite-plugin-combine)

**Functionality**: Combine multiple files into a main file and export the contents of these files according to the configuration. Supports named export, default export, and no export modes.

### [vite-plugin-cp](packages/vite-plugin-cp)

**Functionality**: Copy files to a specified directory.

### [vite-plugin-external](packages/vite-plugin-external)

**Functionality**: Exclude specified module dependencies, supports development runtime and bundled files.

### [vite-plugin-hook-use](packages/vite-plugin-hook-use)

**Functionality**: Display the order and count of Vite hook function calls.

### [vite-plugin-include-css](packages/vite-plugin-include-css)

**Functionality**: Bundle CSS code into a single JS file.

### [vite-plugin-mock-data](packages/vite-plugin-mock-data)

**Functionality**: Configure local mock data.

### [vite-plugin-reverse-proxy](packages/vite-plugin-reverse-proxy)

**Functionality**: Proxy online resources to local for debugging with Chrome extension [XSwitch](https://chrome.google.com/webstore/detail/xswitch/idkjhjggpffolpidfkikidcokdkdaogg).

### [vite-plugin-separate-importer](packages/vite-plugin-separate-importer)

**Functionality**: Split batch imports from a source module into individual file imports.

## Installation

Install project dependencies using `npm run deps`:

```bash
npm run deps
```

## Scripts

The project includes several npm scripts for different development and build tasks:

- `deps`: Clean and install dependencies.
- `clean`: Clean `node_modules` directories.
- `eslint`: Run ESLint for code formatting and linting.
- `build:packages`: Build all plugin packages in parallel.
- `build:examples`: Build all example projects in parallel.
- `prepare`: Install Husky hooks.
- `docs`: Generate project documentation.

## Directory Structure

```
vite-plugins/
├── examples/          # Example projects
├── packages/          # Plugin packages
│   ├── vite-plugin-combine/
│   ├── vite-plugin-cp/
│   ├── vite-plugin-external/
│   ├── vite-plugin-hook-use/
│   ├── vite-plugin-include-css/
│   ├── vite-plugin-mock-data/
│   ├── vite-plugin-reverse-proxy/
│   └── vite-plugin-separate-importer/
├── .eslintignore      # ESLint ignore file
├── .eslintrc.js       # ESLint configuration file
├── .husky/            # Husky configuration directory
├── .lintstagedrc.js   # lint-staged configuration file
├── package.json       # Project configuration file
├── README.md          # English README
├── README_zh-CN.md    # Chinese README
└── typedoc.json       # TypeDoc configuration file
```

## Example Projects

The project includes several example projects demonstrating how to use these plugins:

- [vite3-demo](./examples/vite3-demo)
- [vite4-demo](./examples/vite4-demo)
- [vite5-demo](./examples/vite5-demo)
- [vite6-demo](./examples/vite6-demo)

## Contribution

Contributions are welcome! Please ensure your code meets the project standards and passes all test cases.

## License

MIT