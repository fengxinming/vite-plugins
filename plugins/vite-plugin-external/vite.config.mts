import { builtinModules } from 'node:module';

import ts from '@rollup/plugin-typescript';
import { defineConfig } from 'vitest/config';

import pkg from './package.json' with { type: 'json' };

const externals = Object.keys(pkg.dependencies)
  .concat(builtinModules, 'vite')
  .map((n) => new RegExp(`^${n}/?`))
  .concat(/^node:/);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    ts({
      tsconfig: './tsconfig.build.json'
    })
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs'],
      fileName: '[name]'
    },
    minify: false,
    rolldownOptions: {
      external: externals,
      output: {
        // Suppress MIXED_EXPORTS warning — index.ts has both a default
        // export (the plugin factory) and named exports (cleanupCache,
        // types). 'named' keeps the default accessible via .default.
        // 抑制 MIXED_EXPORTS 警告——index.ts 同时有 default 和命名导出。
        exports: 'named'
      }
    }
  },
  test: {
    // Tests live OUTSIDE src/ to keep production code clean.
    // 测试文件独立放在 test/ 下，和生产代码分离。
    include: ['test/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts']
    }
  }
});
