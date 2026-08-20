# 配置项（旧版）

> Type definitions copied verbatim from the plugin TypeScript source:
>
```ts
export interface Options {
  /**
   * The target script to be proxied.
   *
   * 需要被代理转发的入口脚本。
   * key 是访问时使用的「浏览器路径」，value 是项目里的源文件（如 `src/main.jsx`）。
   *
   * 例：`{ '/app.js': 'src/main.jsx' }` 代表访问 `/app.js` 时，
   * 返回的不再是纯模块，而是一份“注入了 Vite HMR client + main.jsx module”的普通
   * `text/javascript` 脚本 —— 这样可以在不支持 `<script type="module">` 的宿主
   * 环境里直接用 `<script src="/app.js">` 加载 Vite 项目入口。
   */
  targets: Record<string, string>;

  /**
   * The preamble code to be injected before the main script.
   *
   * 可选的「预加载代码」，在 Vite HMR client 注入之后、主入口加载之前执行。
   * 典型用法是宿主需要在项目模块运行之前先挂一个全局 polyfill、全局变量、埋点 SDK
   * 初始化等。支持占位符 `__BASE__` 会被替换为 `vite.config.ts` 里的 `base`。
   */
  preambleCode?: string;
}
```

<div class="vp-doc legacy-banner">

> ⚠️ **本页是 Vite 1–6 时代的旧版文档。**
> 访问最新版请点击顶部 **Plugins → vite-plugin-reverse-proxy** 或跳转
> <a href="/plugins/vite-plugin-reverse-proxy/options?latest=1">/plugins/vite-plugin-reverse-proxy/options</a>。

</div>

## 用法速览

```ts
import { defineConfig } from 'vite';
import reverseProxy from 'vite-plugin-reverse-proxy';

export default defineConfig({
  plugins: [
    reverseProxy({
      targets: {
        '/app.js': 'src/main.jsx',
      },
      preambleCode: `console.log('base=', __BASE__);`,
    }),
  ],
});
```
