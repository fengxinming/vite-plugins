import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import engineSource from 'consolidate';
import type { Plugin, ResolvedConfig } from 'vite';
import { normalizePath } from 'vite';
import { banner, toAbsolutePath } from 'vp-runtime-helper';

import { extractAssetTags, injectAssetTagsIntoTemplate } from './asset-tags';
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
export default function view(opts: Options): Plugin | Plugin[] {
  const {
    entry,
    logLevel,
    enableBanner,
    strategy: {
      dev: devStrategy = 'intercept',
      build: buildStrategy = 'html'
    } = {},
    injectPlaceholder
  } = opts;

  if (enableBanner) {
    banner(PLUGIN_NAME);
  }

  if (logLevel) {
    logger.level = logLevel;
  }

  let resolvedConfig: ResolvedConfig;
  let engine: Engine;
  // 虚拟 `.html` id → 磁盘上真实 `.<engine>` 模板路径。
  // resolveId 写入，load / generateBundle 读取。
  const tpl2html = new Map<string, string>();

  // delegate 策略写入的 `.html` 文件记录，供进程退出钩子清理与还原备份。
  // 与 tpl2html 同级声明，保证 configureServer/configurePreviewServer 的
  // HMR 重启后数据仍保留。
  const delegateWritten: DelegateWrittenMap = new Map();

  /**
   * 主插件：入口解析、模板加载、dev/preview 中间件。
   * 默认 `enforce: 'pre'`，在 Rolldown 内置入口解析器之前拦截模板入口。
   */
  const mainPlugin: Plugin = {
    name: PLUGIN_NAME,
    apply: opts.apply,
    // Vite 8 / Rolldown 对磁盘上已存在的入口不调 resolveId，
    // 因此必须默认 'pre' 优先拦截模板入口；用户可用 'post' 覆盖。
    enforce: opts.enforce ?? 'pre',
    config() {
      engine = new Engine(opts);

      // 入口必须经 build.rolldownOptions.input 交给 build-html 流水线。
      // 顶层 input 只对 JS/TS 入口有效，传模板路径会被 Rolldown 当 JS
      // 解析并报 PARSE_ERROR。
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

      logger.debug('Entries:', config.build?.rolldownOptions?.input ?? '(none)');
    },

    resolveId(source: string) {
      const { extension } = engine;

      if (source.endsWith(extension)) {
        // 先解析为绝对路径，让虚拟 .html id 锚定到 root——
        // build-html 插件按入口 id 推导输出文件名，相对 id 会越出 outDir。
        const absPath = toAbsolutePath(source, resolvedConfig.root);
        const virtualId = `${absPath.slice(0, absPath.lastIndexOf(extension))}.html`;

        tpl2html.set(virtualId, absPath);
        return virtualId;
      }
    },

    load(id: string) {
      const templatePath = tpl2html.get(id);

      if (templatePath) {
        // Engine.render 通过 this.config（configResolved 中设置）调
        // engineOptions 函数，无需在此传 resolvedConfig。
        return engine.render(templatePath);
      }
    },

    configureServer(server) {
      // PREPEND 到中间件栈顶端，保证在 spaFallbackMiddleware 之前匹配模板。
      // delegate 策略下传入可写的 delegateWritten Map 记录磁盘写入。
      return () => installIndexHtmlMiddleware(
        engine,
        resolvedConfig.root,
        server,
        devStrategy === 'delegate' ? delegateWritten : undefined
      );
    },

    configurePreviewServer(server) {
      // preview 模式同样注册中间件，基于磁盘原始模板动态渲染（无需重建）。
      return () => installIndexHtmlMiddleware(engine, resolvedConfig.root, server);
    }
  };

  /**
   * 构建插件：`enforce: 'post'`（buildHtmlPlugin 之后）运行。
   * 当 `strategy.build` 为 'template' / 'both' 时，从编译产物中提取
   * 资源标签注入原始模板源码并输出模板文件；'html'（默认）时不做任何事。
   */
  const buildPlugin: Plugin = {
    name: `${PLUGIN_NAME}-build`,
    enforce: 'post',
    apply: 'build',

    generateBundle(_options, bundle) {
      for (const [virtualHtmlId, templatePath] of tpl2html) {
        // 编译后的 .html 产物 fileName 是相对项目根目录的路径
        const htmlFileName = normalizePath(
          path.relative(resolvedConfig.root, virtualHtmlId)
        );

        const htmlAsset = bundle[htmlFileName];
        if (!htmlAsset || htmlAsset.type !== 'asset') {
          logger.debug(`No html asset found for ${htmlFileName}, skipping`);
          continue;
        }

        // 提取 buildHtmlPlugin 注入的资源标签（其生成的 script/link 恒带
        // crossorigin，以此与用户手写标签区分）
        const htmlSource = typeof htmlAsset.source === 'string'
          ? htmlAsset.source
          : new TextDecoder().decode(htmlAsset.source);
        const assetTags = extractAssetTags(htmlSource);
        if (!assetTags) {
          logger.debug(`No asset tags found in ${htmlFileName}, skipping`);
          continue;
        }

        // 读取原始模板源码，保留 <%= title %> / #{variable} 等模板语法。
        // 对齐 Vite buildHtmlPlugin：publicDir 资源的标签只改写不删除，
        // 这里同样需要保留，因此传入 isPublicFile 供移除逻辑判断。
        const templateSource = readFileSync(templatePath, 'utf-8');
        const { publicDir } = resolvedConfig;
        const isPublicFile = (url: string): boolean => {
          return !!publicDir
            && url.startsWith('/')
            && existsSync(path.join(publicDir, url.slice(1)));
        };

        const output = injectAssetTagsIntoTemplate(
          templateSource,
          assetTags,
          {
            injectPlaceholder,
            extension: path.extname(templatePath).toLowerCase(),
            templatePath,
            isPublicFile
          },
        );

        // 输出模板文件到 dist，保留原始扩展名
        const relativePath = normalizePath(
          path.relative(resolvedConfig.root, templatePath)
        );
        this.emitFile({
          type: 'asset',
          originalFileName: templatePath,
          fileName: relativePath,
          source: output
        });

        // template 模式（非 both）下移除编译后的 .html 产物
        if (buildStrategy !== 'both') {
          delete bundle[htmlFileName];
        }
      }
    }
  };

  return buildStrategy === 'html' ? mainPlugin : [mainPlugin, buildPlugin];
}

export { engineSource, view, view as vitePluginView };
