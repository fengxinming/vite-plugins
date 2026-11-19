import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';
import pluginSeparateImporter from 'vite-plugin-separate-importer';

/**
 * 示例 2：自定义 insertSideEffect 注入样式导入
 *
 * resolveModule 控制 JS 模块的拆分路径，
 * insertSideEffect 控制在拆分后额外插入的语句（通常是样式文件导入）。
 *
 * 这里演示不依赖 decamelize，手动实现 kebab-case 转换。
 *
 * 搭配 vite-plugin-external 把 lodash（含子路径）标记为 external，
 * 拆出的 lodash/<fn> 子路径 import 才会保留进 dist 产物。
 */
export default defineConfig({
  plugins: [
    pluginExternal({
      cacheDir: './node_modules/.vite_external/2',
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
          //   // lodash 没有样式，insertSideEffect 返回空字符串表示不插入
          //   return '';
          // }
        }
      ]
    })
  ],
  build: {
    outDir: 'dist/2',
    minify: false,
    lib: {
      entry: 'src/lodash-demo.ts',
      formats: ['es', 'cjs'],
      fileName: 'index'
    }
  }
});
