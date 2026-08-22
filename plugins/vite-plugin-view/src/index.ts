import engineSource from 'consolidate';
import type { Plugin, ResolvedConfig } from 'vite';
import { banner, toAbsolutePath } from 'vp-runtime-helper';

import Engine from './Engine';
import { installIndexHtmlMiddleware } from './indexHtml';
import { logger, PLUGIN_NAME } from './logger';
import { DelegateWrittenMap, Options } from './typings';

/**
 * Shows the usage of the hook function of the `vite` plugin.
 *
 * @example
 * ```js
import { defineConfig } from 'vite';
import { view } from 'vite-plugin-view';

export default defineConfig({
  plugins: [
    view({
      engine: 'pug',  // 必填：指定模板引擎
    })
  ]
});
 * ```
 *
 * @returns a vite plugin
 */
function view(opts: Options): Plugin | undefined {
  const {
    entry,
    logLevel,
    enableBanner,
    strategy = 'intercept'
  } = opts;

  if (enableBanner) {
    banner(PLUGIN_NAME);
  }

  if (logLevel) {
    logger.level = logLevel;
  }

  let resolvedConfig: ResolvedConfig;
  let engine: Engine;
  // Map of virtual `.html` id → real `.<engine>` template path on disk.
  // Populated by resolveId, consumed by load.
  // 虚拟 `.html` id → 磁盘上真实 `.<engine>` 模板路径的映射。
  // resolveId 写入，load 读取。
  const tpl2html = new Map<string, string>();

  /**
   * Per-plugin-instance record of `.html` files emitted by the `delegate`
   * strategy. Lives alongside `tpl2html` at the same scope level so it
   * survives HMR restarts of configureServer/configurePreviewServer.
   * When this Map is passed into the middleware, the middleware writes each
   * rendered template to a sibling `.html` file on disk, records the write
   * entry here, and hands off to the downstream pipeline. Entries are used
   * on process exit to delete generated files and restore any `.bak_*`
   * backups to their original names.
   *
   * 每个插件实例在 `delegate` 策略下写入的 `.html` 文件记录。
   * 与 `tpl2html` 定义在同一作用域层级，这样在 configureServer /
   * configurePreviewServer 的 HMR 重启过程中数据能保留。
   * 当此 Map 被传入中间件时，中间件会将每个渲染后的模板写入
   * 同目录下的 `.html` 磁盘文件，将写入条目记录于此，
   * 再转交给下游流水线处理。进程退出时根据记录删除生成的文件，
   * 并将任何 `.bak_*` 备份还原为原文件名。
   */
  const delegateWritten: DelegateWrittenMap = new Map();

  return {
    name: PLUGIN_NAME,
    // Vite 8 / Rolldown 1.2.4 skips resolveId for entries that exist on disk,
    // so the plugin must run at 'pre' priority by default to intercept the
    // template entry (e.g. index.ejs) before Rolldown's built-in entry
    // resolver. Users can still override with 'post' if they need the plugin
    // to run after Vite's own HTML pipeline.
    //
    // Vite 8 / Rolldown 1.2.4 对磁盘上存在的入口文件不会调 resolveId 钩子，
    // 所以插件必须默认以 'pre' 优先级运行，才能在 Rolldown 内置入口解析器
    // 之前拦截模板入口（如 index.ejs）。如果用户需要插件在 Vite 自己的
    // HTML 流水线之后跑，可以显式传 'post' 覆盖。
    enforce: opts.enforce ?? 'pre',
    config() {
      engine = new Engine(opts);

      // Pass the user-declared entry (or the default `index.<engine>`) straight
      // to Rolldown's `build.rolldownOptions.input`. We can NOT use Vite 8's
      // top-level `input` option here, even though docs say it's the default
      // for `build.rolldownOptions.input` — that path is for JS/TS entries
      // (`src/main.ts`). For HTML entries, Vite's build-html pipeline must
      // pick up the input via `build.rolldownOptions.input`; passing a `.ejs`
      // / `.pug` template path via the top-level `input` makes Rolldown parse
      // it as JavaScript and fail with `PARSE_ERROR`.
      //
      // resolveId will rewrite each `.<engine>` entry to a virtual `.html` id
      // so Vite's build-html pipeline picks it up; load renders the template
      // into HTML.
      //
      // 不能用 Vite 8 顶层 `input`——文档说它是
      // `build.rolldownOptions.input` 的 default，但那只对 JS/TS 入口
      // （`src/main.ts`）有效。HTML 入口必须经 Vite 的 build-html 流水线，
      // 它读 `build.rolldownOptions.input`；如果把 `.ejs`/`.pug` 模板路径
      // 放顶层 `input`，Rolldown 会当 JS 解析，报 `PARSE_ERROR`。
      //
      // resolveId 把每个 `.<engine>` 入口改写成虚拟 `.html` id 让 Vite 的
      // build-html 流水线接管；load 负责把模板渲染成 HTML。
      return {
        build: {
          rolldownOptions: {
            input: entry || `index${engine.extension}`
          }
        }
      };
    },

    configResolved(config: ResolvedConfig) {
      resolvedConfig = config;
      engine.config = config;

      // config.build.rolldownOptions may be absent (e.g. user overrode build
      // config); use optional chaining so debug logging never throws.
      // config.build.rolldownOptions 可能不存在（如用户覆盖了 build 配置）；
      // 用可选链防止 debug 日志抛错。
      logger.debug('Entries:', config.build?.rolldownOptions?.input ?? '(none)');
    },

    resolveId(source: string) {
      const { extension } = engine;

      if (source.endsWith(extension)) {
        // Resolve to an absolute path first so the virtual .html id is also
        // absolute. Vite 8 / Rolldown's build-html plugin derives the output
        // fileName from the entry id; a relative id like "index.html" makes it
        // climb above the outDir, so we anchor the virtual id to root.
        // 先解析成绝对路径，让虚拟 .html id 也是绝对的。Vite 8 / Rolldown 的
        // build-html 插件会根据入口 id 推导输出文件名；如果是 "index.html" 这种
        // 相对 id，文件名会跑到 outDir 之外，所以把虚拟 id 锚定到 root。
        const absPath = toAbsolutePath(source, resolvedConfig.root);
        const virtualId = `${absPath.slice(0, absPath.lastIndexOf(extension))}.html`;

        tpl2html.set(virtualId, absPath);
        return virtualId;
      }
    },

    load(id: string) {
      const resolveId = tpl2html.get(id);

      if (resolveId) {
        // Engine.render reads `this.config` (set in configResolved) for
        // engineOptions function call. No need to pass resolvedConfig here.
        // Engine.render 通过 `this.config`（在 configResolved 里设置）调
        // engineOptions 函数。这里不需要再传 resolvedConfig。
        return engine.render(resolveId);
      }
    },

    configureServer(server) {
      // installIndexHtmlMiddleware PREPENDS to the middleware stack so the
      // template-matching logic runs first on the original incoming URL.
      // installIndexHtmlMiddleware 会 PREPEND 到中间件栈最顶端，
      // 让模板匹配逻辑在原始请求 URL 上最先执行。
      //
      // When strategy is set to `'delegate'`, pass the writable `delegateWritten`
      // Map to the middleware. The middleware will record every generated
      // `.html` file path and (if created) the `.bak_*` backup path in this Map.
      // 当 strategy 设为 `'delegate'` 时，将可写的 `delegateWritten` Map
      // 传入中间件。中间件会把每个生成的 `.html` 文件路径与（如创建的话）
      // `.bak_*` 备份路径记录到该 Map 中。
      return () => installIndexHtmlMiddleware(
        engine,
        resolvedConfig.root,
        server,
        strategy === 'delegate' ? delegateWritten : undefined
      );
    },

    configurePreviewServer(server) {
      // Register the middleware in `vite preview` as well, so preview mode
      // supports dynamic template rendering against the original source
      // templates on disk (without requiring a re-build on every change).
      // 在 `vite preview` 中同样注册中间件，使 preview 模式能基于磁盘上的
      // 原始模板文件进行动态渲染（无需每次改动都重新构建）。
      //
      // Preview mode serves files from the built output directory via a
      // static-file server. The middleware therefore always renders templates
      // in memory and sends the response directly.
      // preview 模式通过静态文件服务器从构建输出目录提供文件。
      // 因此中间件始终在内存中渲染模板并直接返回响应。
      return () => installIndexHtmlMiddleware(engine, resolvedConfig.root, server);
    }
  } as Plugin;
}

export { engineSource, view };
