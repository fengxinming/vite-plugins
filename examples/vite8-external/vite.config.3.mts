import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';
import { view } from 'vite-plugin-view';

/**
 * 示例 3：externalizeDeps — 纯 external 不生成 shim
 *
 * externalizeDeps 将指定依赖标记为"不打包"，但不生成全局变量 shim 文件：
 * build 产物保留裸 import，由宿主（Node）解析；dev 同样生效，模块里被 vite 改写成
 * /@id/<说明符>，浏览器侧要用 <script type="importmap"> 把这些键指到可访问的 ESM 地址，
 * 页面才真跑得起来 —— 表由本 config 的 engineOptions.importMap 给（见 index.pug）。
 *
 * 键带 /@id/ 前缀不是笔误：vite 8.3.5 的 import-analysis 会把标记为 external 的裸说明符
 * 统一包成 /@id/<说明符>（实测 external:'absolute' 与 external:true 两种写法都一样），
 * import map 的键必须匹配浏览器实际看到的那个 URL。
 *
 * 页面入口指向构建入口 src/lib2.ts。
 *
 * view() 只在 serve 下挂：ES lib 构建和 html 入口不能共存。实测在 build 下
 * 配页面，dist/3/my-lib.js 只剩三条 side-effect import 和 polyfill（885B），
 * 五个 export 全被 tree-shake 掉——lib 的公开 API 直接消失。
 */
export default defineConfig(({ command }) => ({
  plugins: [
    ...(command === 'serve'
      ? [view({
        engine: 'pug',
        engineOptions: {
          title: 'vite-plugin-external example 3',
          description: 'Powered by vite-plugin-external',
          // 纯 external 不给全局名也不给 CDN，运行时地址只能由使用方声明；
          // 这里取 esm.sh 上与本示例 node_modules 同版本的包（逐个 HEAD 实测 200）。
          cdnScripts: [],
          importMap: {
            '/@id/lodash': 'https://esm.sh/lodash@4.18.1',
            '/@id/dayjs': 'https://esm.sh/dayjs@1.11.23',
            // ?bundle 不能省：esm.sh 默认把 @babel/core 依赖的 data/*.json 原样按
            // application/json 返回，浏览器以模块脚本对待并因 MIME 不符直接拒绝（实测 4 条
            // "Strict MIME type checking is enforced"）。?bundle 让 esm.sh 把整张依赖图
            // （含 JSON）打成一个自包含模块，页面才真正跑得起来。
            '/@id/@babel/core': 'https://esm.sh/@babel/core@8.0.10?bundle'
          },
          entry: '/src/lib2.ts'
        }
      })]
      : []),
    pluginExternal({
      // 每个 config 用各自的 stash 目录，测试串行复用缓存时互不覆盖。
      cacheDir: './node_modules/.vite_external/3',
      externalizeDeps: ['lodash', 'dayjs', /^@babel\//]
    })
  ],
  build: {
    outDir: 'dist/3',
    lib: {
      entry: 'src/lib2.ts',
      formats: ['es'],
      fileName: 'my-lib'
    }
  }
}));
