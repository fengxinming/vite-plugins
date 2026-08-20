import { defineConfig } from 'vite';
import pluginCp from 'vite-plugin-cp';

/**
 * 示例 3：复制时转换文件内容（transform）
 *
 * transform 接收 Buffer，返回修改后的内容。
 * 典型场景：构建后修改 package.json 的 version、
 * 去除 sourcemap 引用、注入 banner 等。
 */
export default defineConfig({
  plugins: [
    pluginCp({
      targets: [
        // 复制 package.json 但只保留 name/version/main 字段
        {
          src: 'package.json',
          dest: 'dist',
          transform(buf: Buffer) {
            const pkg = JSON.parse(buf.toString());
            return JSON.stringify({
              name: pkg.name,
              version: pkg.version,
              main: './my-lib.js'
            }, null, 2);
          }
        },

        // 复制 CSS 并去除 sourcemap 注释
        {
          src: 'src/style.css',
          dest: 'dist',
          transform(buf: Buffer) {
            return buf.toString().replace(/\/\*# sourceMappingURL=.*\*\//g, '');
          }
        }
      ]
    })
  ],
  build: {
    outDir: 'dist/3',
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'my-lib'
    }
  }
});
