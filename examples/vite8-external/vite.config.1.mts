import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

/**
 * @example vite-plugin-external
 *
 * 将 react / react-dom 标记为外部依赖，构建产物中不包含它们，
 * 运行时从全局变量 `React` / `ReactDOM` 读取。
 * 适用于 CDN 加载依赖的 IIFE/UMD 构建场景。
 */
export default defineConfig({
  plugins: [
    pluginExternal({
      // logLevel: 'TRACE',
      externals: {
        react: 'React',
        'react-dom': 'ReactDOM',
        'react-dom/client': 'ReactDOM'
      }
    })
    // {
    //   name: 'test-000',
    //   resolveId: {
    //     order: 'pre',
    //     handler(id) {
    //       console.log('resolveId <<<<=', id);
    //     }
    //   },
    //   load() {

    //   }
    // }
  ],
  build: {
    outDir: 'dist/1',
    minify: false,
    rolldownOptions: {
      output: {
        format: 'iife'
      }
      // plugins: [
      //   {
      //     name: 'test-111',
      //     resolveId: {
      //       order: 'pre',
      //       handler(id) {
      //         console.log('resolveId =>>>>>', id);
      //       }
      //     }
      //   }
      // ]
    }
  }
});
