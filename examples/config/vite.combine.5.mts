
import { defineConfig, PluginOption } from 'vite';
import vitePluginCombine from 'vite-plugin-combine';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vitePluginCombine({
      logLevel: 'TRACE',
      src: ['src/util/*.ts', '!src/util/typings.ts'],
      target: 'src/combine.5.ts',
      beforeWrite(code) {
        return `${code}export * from './util/typings';`;
      },
      dts: true
    }) as unknown as PluginOption
  ],
  build: {
    outDir: 'dist/combine/5',
    minify: false,
    lib: {
      entry: [],
      formats: ['es', 'cjs'],
      fileName(format, entryName) {
        return entryName + (format === 'es' ? '.mjs' : '.js');
      }
    }
  }
});
