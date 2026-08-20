import { defineConfig } from 'vite';
import pluginHookUse from 'vite-plugin-hook-use';

/**
 * @example vite-plugin-hook-use
 *
 * 在终端输出 Vite 插件各钩子的调用顺序和次数，
 * 帮助开发者理解插件生命周期。无配置项，直接引入即可。
 */
export default defineConfig({
  plugins: [
    pluginHookUse()
  ],
  build: {
    outDir: 'dist/1',
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'index'
    }
  }
});
