import { defineConfig } from 'vite';
import vitePluginHookUse from 'vite-plugin-hook-use';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vitePluginHookUse()
  ],
  build: {
    lib: {
      entry: 'src/utils/isNil.js',
      formats: ['es']
    }
  }
});
