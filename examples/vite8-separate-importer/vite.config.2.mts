import { defineConfig } from 'vite';
import pluginSeparateImporter from 'vite-plugin-separate-importer';

/**
 * 示例 2：自定义 insertSideEffect 注入样式导入
 *
 * resolveModule 控制 JS 模块的拆分路径，
 * insertSideEffect 控制在拆分后额外插入的语句（通常是样式文件导入）。
 *
 * 这里演示不依赖 decamelize，手动实现 kebab-case 转换。
 */
export default defineConfig({
  plugins: [
    pluginSeparateImporter({
      libs: [
        {
          name: 'lodash',
          resolveModule(importer) {
            const kebab = importer.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
            return `lodash/${kebab}`;
          },
          insertSideEffect() {
            // lodash 没有样式，insertSideEffect 返回空字符串表示不插入
            return '';
          }
        }
      ]
    })
  ],
  build: {
    outDir: 'dist/2',
    lib: {
      entry: 'src/lodash-demo.ts',
      formats: ['es'],
      fileName: 'index'
    }
  }
});
