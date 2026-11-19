import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';
import pluginSeparateImporter from 'vite-plugin-separate-importer';

/**
 * 示例 3：named re-export 拆分
 *
 * 不仅 import，export { x } from 'lib' 形式的 re-export 也被拆分：
 *   export { get } from 'lodash' → export { default as get } from 'lodash/get'
 *   export { merge as mergeDeep } from 'lodash' → export { default as mergeDeep } from 'lodash/merge'
 *
 * 搭配 vite-plugin-external 把 lodash（含子路径）external，拆出的子路径
 * re-export 才会保留进 dist。star re-export（export * from）不在拆分范围，原样保留。
 */
export default defineConfig({
  plugins: [
    pluginExternal({
      cacheDir: './node_modules/.vite_external/3',
      externalizeDeps: ['lodash']
    }),
    pluginSeparateImporter({
      libs: [
        {
          name: 'lodash',
          resolveModule(importer) {
            const kebab = importer.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
            return `lodash/${kebab}`;
          }
          // insertSideEffect() {
          //   return '';
          // }
        }
      ]
    })
  ],
  build: {
    outDir: 'dist/3',
    minify: false,
    lib: {
      entry: 'src/reexport-demo.ts',
      formats: ['es', 'cjs'],
      fileName: 'index'
    },
    rolldownOptions: {
      output: {
        externalLiveBindings: false
      }
    }
  }
});
