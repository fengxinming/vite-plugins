import { defineConfig } from 'vite';
import pluginCp from 'vite-plugin-cp';

/**
 * 示例 2：复制时重命名 + glob 模式匹配
 *
 * 演示 rename（字符串替换 / 函数重命名）和 glob 通配符。
 * flatten: true 会忽略源目录结构，将所有文件平铺到 dest。
 */
export default defineConfig({
  plugins: [
    pluginCp({
      targets: [
        // glob 匹配所有 .ts 文件，平铺到 types/
        { src: 'src/**/*.ts', dest: 'dist/types', flatten: true },

        // 复制并重命名：函数方式
        {
          src: 'src/index.ts',
          dest: 'dist',
          rename(name) {
            return name.replace('.ts', '.esm.ts');
          }
        }
      ]
    })
  ],
  build: {
    outDir: 'dist/2',
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'my-lib'
    }
  }
});
