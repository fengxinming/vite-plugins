import { defineConfig } from 'vite';
import vitePluginHookUse from 'vite-plugin-hook-use';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vitePluginHookUse()
  ],
  build: {
    outDir: 'dist/hook-use',
    lib: {
      entry: 'src/util/noop.ts',
      formats: ['es'],
      fileName: 'hook-use'
    }
  }
});
