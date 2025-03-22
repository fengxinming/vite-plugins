# Local Debugging

## Installation

Use `npm run deps` to install project dependencies:

```bash
npm run deps
```

## Script Commands

The project includes multiple npm scripts for various development and build tasks:

- `deps`: Clean and install dependencies.
- `clean`: Clean the `node_modules` directory.
- `eslint`: Run ESLint for code formatting and linting.
- `build:packages`: Parallel build all plugin packages.
- `build:examples`: Parallel build all example projects.
- `prepare`: Install Husky hooks.
- `docs:dev`: Start the project documentation development server.
- `docs:preview`: Preview the project documentation.
- `docs:build`: Generate the project documentation.

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
├── package.json       # Project configuration file
└── README.md          # English README
```

## Example Projects

The project includes multiple example projects demonstrating how to use these plugins:

* [vite3 demo](https://github.com/fengxinming/vite-plugins/tree/main/examples/vite3-demo)
* [vite4 demo](https://github.com/fengxinming/vite-plugins/tree/main/examples/vite4-demo)
* [vite5 demo](https://github.com/fengxinming/vite-plugins/tree/main/examples/vite5-demo)
* [vite6 demo](https://github.com/fengxinming/vite-plugins/tree/main/examples/vite6-demo)
