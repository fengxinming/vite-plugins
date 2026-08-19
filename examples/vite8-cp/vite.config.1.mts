import { defineConfig } from 'vite';
import pluginCp from 'vite-plugin-cp';

/**
 * @example vite-plugin-cp
 *
 * 构建完成后将产物复制到指定目录。
 * 适用于需要将 dist 产物同步到服务端静态资源目录、
 * 或复制 README/LICENSE 等文件到发布包的场景。
 */
export default defineConfig({
  plugins: [
    pluginCp({
      targets: [
        // 复制构建产物到 deploy/static
        { src: 'dist/1', dest: 'deploy/static' },

        // 复制单个文件并重命名
        { src: 'dist/1/my-lib.js', dest: 'deploy', rename: 'my-lib.esm.js' },

        // 复制时转换文件内容
        {
          src: 'dist/1/my-lib.js',
          dest: 'deploy',
          rename: 'my-lib.min.js',
          transform(buf: Buffer) {
            return buf.toString().replace(/\/\/# sourceMappingURL=.*/, '');
          }
        }
      ]
    })
  ],
  build: {
    outDir: 'dist/1',
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'my-lib'
    }
  }
});
