# vite-plugin-build-chunk

[![npm package](https://nodei.co/npm/vite-plugin-build-chunk.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/vite-plugin-build-chunk)

> 

[![NPM version](https://img.shields.io/npm/v/vite-plugin-build-chunk.svg?style=flat)](https://npmjs.org/package/vite-plugin-build-chunk)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-build-chunk.svg?style=flat)](https://npmjs.org/package/vite-plugin-build-chunk)
[![Node version](https://img.shields.io/node/v/vite-plugin-build-chunk.svg?style=flat)](https://npmjs.org/package/vite-plugin-build-chunk)

## Installation

```bash
npm install vite-plugin-build-chunk --save-dev
```

## Usage

```js
import { defineConfig } from 'vite';
import pluginBuildChunk from 'vite-plugin-build-chunk';

export default defineConfig({
  plugins: [
    pluginBuildChunk({
      chunk: 'index.mjs',
      name: 'MyLib',
      format: 'umd',
      minify: false
    })
  ]
});
```


## Documentation

For detailed usage instructions and API references, please visit the official documentation:

👉 [View Full Documentation](https://fengxinming.github.io/vite-plugins/plugins/vite-plugin-build-chunk/quick-start)

## Contributing

We welcome contributions from the community! If you find a bug or want to suggest an improvement, feel free to open an issue or submit a pull request.

### How to Contribute
1. Fork the repository.
2. Create a new branch for your changes.
3. Submit a pull request with a clear description of your changes.

## License

This project is licensed under the [MIT License](LICENSE).