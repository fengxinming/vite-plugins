# vite-plugin-external

[![npm package](https://nodei.co/npm/vite-plugin-external.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/vite-plugin-external)

[![NPM version](https://img.shields.io/npm/v/vite-plugin-external.svg?style=flat)](https://npmjs.org/package/vite-plugin-external)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-external.svg?style=flat)](https://npmjs.org/package/vite-plugin-external)

> Excludes specified module dependencies from runtime code and built bundles.
> Vite >= 3.1

```js
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    pluginExternal({
      externals: {
        jquery: '$',

        react: 'React',
        'react-dom/client': 'ReactDOM',

        vue: 'Vue'
      }
    })
  ]
});
```

## Documentation

For detailed usage instructions and API references, please visit the official documentation:

👉 [View Full Documentation https://fengxinming.github.io/vite-plugins/plugins/vite-plugin-external/introduction](https://fengxinming.github.io/vite-plugins/plugins/vite-plugin-external/introduction)

## Contributing

We welcome contributions from the community! If you find a bug or want to suggest an improvement, feel free to open an issue or submit a pull request.

### How to Contribute
1. Fork the repository.
2. Create a new branch for your changes.
3. Submit a pull request with a clear description of your changes.

## License

This project is licensed under the [MIT License](../../LICENSE).