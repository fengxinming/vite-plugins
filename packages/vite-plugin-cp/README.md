# vite-plugin-cp

[![npm package](https://nodei.co/npm/vite-plugin-cp.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/vite-plugin-cp)

[![npm version](https://img.shields.io/npm/v/vite-plugin-cp.svg)](https://npmjs.org/package/vite-plugin-cp)
[![npm downloads](https://img.shields.io/npm/dm/vite-plugin-cp.svg)](https://npmjs.org/package/vite-plugin-cp)
[![Node version](https://img.shields.io/node/v/vite-plugin-cp.svg?style=flat)](https://npmjs.org/package/vite-plugin-cp)

> A powerful Vite plugin for copying files/directories with advanced transformation and renaming capabilities.

---

## Installation

```bash
npm install vite-plugin-cp --save-dev
```

## Usage

```js
import { defineConfig } from 'vite';
import cp from 'vite-plugin-cp';

export default defineConfig({
  plugins: [
    cp({
      targets: [
        // Copy all files from 'node_modules/vite/dist' to 'dist/cp/test'
        { src: './node_modules/vite/dist', dest: 'dist/cp/test' },

        // Copy all files from 'node_modules/vite/dist' to 'dist/cp/test2', but keep the directory structure
        { src: './node_modules/vite/dist', dest: 'dist/cp/test2', flatten: false },

        // Copy the README.md file from 'node_modules/vite' to 'dist/cp'
        { src: './node_modules/vite/README.md', dest: 'dist/cp' },

        { src: './node_modules/vite/index.cjs', dest: 'dist/cp', rename: 'index.js' },

        // Copy all .ts files from 'node_modules/vite' to 'dist/cp/types'
        { src: './node_modules/vite/**/*.ts', dest: 'dist/cp/types' },

        // Copy all .ts files from 'node_modules/vite' to 'dist/cp/types2', but modify the name
        {
          src: './node_modules/vite/**/*.ts', dest: 'dist/cp/types2', rename(name) {
            return name.replace('.d.ts', '.ts');
          }
        },

        // Copy the package.json file from 'node_modules/vite' to 'dist/cp', but modify the name and version
        {
          src: './node_modules/vite/package.json', dest: 'dist/cp', transform(buf: Buffer) {
            const pkg = JSON.parse(buf.toString());
            return JSON.stringify({
              ...pkg,
              name: 'vite-plugin-cp-test',
              version: '1.0.0'
            }, null, 2);
          }
        }
      ]
    })
  ]
});
```

---

## Documentation

For detailed usage instructions and API references, please visit the official documentation:

👉 [View Full Documentation](https://fengxinming.github.io/vite-plugins/plugins/vite-plugin-cp/quick-start)

## Contributing

We welcome contributions from the community! If you find a bug or want to suggest an improvement, feel free to open an issue or submit a pull request.

### How to Contribute
1. Fork the repository.
2. Create a new branch for your changes.
3. Submit a pull request with a clear description of your changes.

## License

This project is licensed under the [MIT License](LICENSE).