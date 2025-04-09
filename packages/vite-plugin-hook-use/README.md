# vite-plugin-hook-use

[![npm package](https://nodei.co/npm/vite-plugin-hook-use.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/vite-plugin-hook-use)

> Displays the sequence and frequency of vite calling its hook functions.

[![NPM version](https://img.shields.io/npm/v/vite-plugin-hook-use.svg?style=flat)](https://npmjs.org/package/vite-plugin-hook-use)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-hook-use.svg?style=flat)](https://npmjs.org/package/vite-plugin-hook-use)
[![Node version](https://img.shields.io/node/v/vite-plugin-hook-use.svg?style=flat)](https://npmjs.org/package/vite-plugin-hook-use)

## Installation

```bash
npm install vite-plugin-hook-use --save-dev
```

## Usage

```js
import { defineConfig } from 'vite';
import vitePluginHookUse from 'vite-plugin-hook-use';

export default defineConfig({
  plugins: [
    vitePluginHookUse()
  ]
});
```


## Documentation

For detailed usage instructions and API references, please visit the official documentation:

👉 [View Full Documentation](https://fengxinming.github.io/vite-plugins/plugins/vite-plugin-hook-use/quick-start)

## Contributing

We welcome contributions from the community! If you find a bug or want to suggest an improvement, feel free to open an issue or submit a pull request.

### How to Contribute
1. Fork the repository.
2. Create a new branch for your changes.
3. Submit a pull request with a clear description of your changes.

## License

This project is licensed under the [MIT License](LICENSE).