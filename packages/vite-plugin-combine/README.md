# vite-plugin-combine

[![npm package](https://nodei.co/npm/vite-plugin-combine.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/vite-plugin-combine)

[![NPM version](https://img.shields.io/npm/v/vite-plugin-combine.svg?style=flat)](https://npmjs.org/package/vite-plugin-combine)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-combine.svg?style=flat)](https://npmjs.org/package/vite-plugin-combine)

> Combines multiple module files into a single target file. It supports four modes: named exports, default exports, automatic exports, and no exports, and can auto-generate corresponding import statements based on configuration.

```typescript
import { defineConfig } from 'vite';
import combine from 'vite-plugin-combine';

export default defineConfig({
  plugins: [
    combine({
      src: 'src/*.ts', // 匹配要组合的文件路径
      target: 'src/index.ts', // 目标文件路径
      exports: 'named', // 导出类型：'named' | 'default' | 'both' | 'none'
    })
  ],
  resolve: {
    preserveSymlinks: true
  },
  build: {
    minify: false,
    lib: {
      formats: ['es', 'cjs'],
      fileName: '[name]'
    }
  }
});
```

## Documentation

For detailed usage instructions and API references, please visit the official documentation:

👉 [View Full Documentation https://fengxinming.github.io/vite-plugins/plugins/vite-plugin-combine/introduction](https://fengxinming.github.io/vite-plugins/plugins/vite-plugin-combine/quick-start)

## Contributing

We welcome contributions from the community! If you find a bug or want to suggest an improvement, feel free to open an issue or submit a pull request.

### How to Contribute
1. Fork the repository.
2. Create a new branch for your changes.
3. Submit a pull request with a clear description of your changes.

## License

This project is licensed under the [MIT License](../../LICENSE).