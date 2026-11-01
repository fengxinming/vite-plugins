import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

/**
 * 示例 13：lib.formats ['umd'] — UMD 产物同样走原生 external + output.globals
 *
 * rolldown output.globals 官方描述为 "Global variable of UMD / IIFE
 * dependencies"，umd 与 iife 同受 globals 映射；
 * 门控把 build.lib.formats 里的 umd 也识别为 globals 格式，
 * 不再误清原生 external 去走 stash 路线。
 */
export default defineConfig({
  plugins: [
    pluginExternal({
      externals: {
        react: 'React',
        'react-dom/client': 'ReactDOM'
      }
    })
  ],
  build: {
    outDir: 'dist/13',
    minify: false,
    lib: {
      entry: 'src/index.tsx',
      formats: ['umd'],
      name: 'UmdApp'
    }
  }
});
