import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';
import pluginSeparateImporter from 'vite-plugin-separate-importer';

/**
 * @example vite-plugin-separate-importer
 *
 * 将从单个模块的批量导入拆分为逐个文件的独立导入，
 * 配合 tree-shaking 实现按需加载。
 *
 * 典型场景：antd 等 UI 库的按需引入，
 * import { Button } from 'antd' → import 'antd/es/button' + import 'antd/es/button/style'
 *
 * 搭配 vite-plugin-external 把 antd（含子路径）标记为 external，
 * 拆出的子路径 import 才会保留进 dist 产物，而不是被整库打包进去。
 * es 产物留 antd/es/*，cjs 产物经 generateBundle 替换为 antd/lib/*。
 */
export default defineConfig({
  plugins: [
    pluginExternal({
      cacheDir: './node_modules/.vite_external/1',
      externalizeDeps: ['antd']
    }),
    pluginSeparateImporter({
      libs: [
        {
          name: 'antd',
          resolveModule(importer, libName) {
            const kebab = importer.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
            return {
              es: `${libName}/es/${kebab}`,
              cjs: `${libName}/lib/${kebab}`
            };
          },
          insertSideEffect(importer, libName) {
            const kebab = importer.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
            return {
              es: `${libName}/es/${kebab}/style`,
              cjs: `${libName}/lib/${kebab}/style`
            };
          }
        }
      ]
    })
  ],
  build: {
    outDir: 'dist/1',
    minify: false,
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs'],
      fileName(format, entryName) {
        return entryName + (format === 'es' ? '.mjs' : '.js');
      }
    }
  }
});
