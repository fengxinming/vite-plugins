import { defineConfig } from 'vite';
import pluginSeparateImporter from 'vite-plugin-separate-importer';

/**
 * @example vite-plugin-separate-importer
 *
 * 将从单个模块的批量导入拆分为逐个文件的独立导入，
 * 配合 tree-shaking 实现按需加载。
 *
 * 典型场景：antd 等 UI 库的按需引入，
 * import { Button } from 'antd' → import 'antd/es/button' + import 'antd/es/button/style'
 */
export default defineConfig({
  plugins: [
    pluginSeparateImporter({
      libs: [
        {
          name: 'antd',
          importFrom(importer, libName) {
            const kebab = importer.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
            return {
              es: `${libName}/es/${kebab}`,
              cjs: `${libName}/lib/${kebab}`
            };
          },
          insertFrom(importer, libName) {
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
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs'],
      fileName(format, entryName) {
        return entryName + (format === 'es' ? '.mjs' : '.js');
      }
    }
  }
});
