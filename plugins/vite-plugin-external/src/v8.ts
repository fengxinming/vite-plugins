import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { isPlainObject } from 'is-what-type';
import type {
  ConfigEnv,
  DevEnvironment,
  HtmlTagDescriptor,
  IndexHtmlTransformResult,
  Plugin,
  ResolvedConfig,
  Rolldown,
  UserConfig,
  ViteDevServer
} from 'vite';
import { getDepsCacheDir } from 'vp-runtime-helper';

import { PLUGIN_CONFIG_NAME, PLUGIN_NAME } from './common/constants';
import { logger } from './common/logger';
import { Resolver } from './common/Resolver';
import { setExternals } from './lib/handleExternals';
import { createGlobalsFn } from './lib/handleGlobals';
import { setOptimizeDeps } from './lib/handleOptimizeDeps';
import { buildOptions, defaultApply } from './lib/handleOptions';
import type { PluginContext } from './types/_context';
import type { ModuleFormat } from './types/deps';
import type { Options } from './types/options';

export function cleanupCache(
  deps: string[],
  config: ResolvedConfig,
): void {
  if (deps.length === 0) {
    return;
  }

  logger.debug(`Start to clean "${deps.join(',')}".`);

  // SSR build 用单独的 deps cache 目录，这里按 build.ssr 取正确路径。
  const ssr = config.command === 'build' && !!config.build?.ssr;
  const depsCacheDir = getDepsCacheDir(config, ssr);
  const cachedMetadataPath = join(depsCacheDir, '_metadata.json');

  let metadata: { optimized?: Record<string, unknown> };
  try {
    metadata = JSON.parse(readFileSync(cachedMetadataPath, 'utf-8'));
  }
  catch (err) {
    // deps metadata 还不存在（从未预打包过）是正常状态，按无需清理降级；
    // 其余失败（JSON 坏 / 只读文件系统）才是真异常，留日志可查。
    if ((err as { code?: string }).code === 'ENOENT') {
      logger.trace('Deps metadata does not exist yet, nothing to clean.');
    }
    else {
      logger.warn('Failed to read deps metadata:', err);
    }
    return;
  }

  if (!metadata) {
    return;
  }

  const { optimized } = metadata;
  if (optimized && Object.keys(optimized).length) {
    for (const libName of deps) {
      if (optimized[libName]) {
        delete optimized[libName];
      }
    }

    try {
      writeFileSync(cachedMetadataPath, JSON.stringify(metadata));
      logger.debug('Cleanup cache metadata.');
    }
    catch (err) {
      // 无权限 / 只读文件系统：清理是尽力而为，不影响主流程，但要留日志可查。
      logger.warn('Failed to write deps metadata:', err);
    }
  }
}

function createResolvePlugin(ctx: PluginContext, opts: Options): Plugin {
  return {
    name: PLUGIN_NAME,
    enforce: 'pre',
    apply: opts.apply ?? defaultApply,
    resolveId: {
      order: 'pre',
      async handler(id, importer, options) {
        const { resolver, options: resolvedOptions } = ctx;
        const info = await resolver.resolve(id, importer, options);

        if (!info) {
          logger.trace(`[resolveId] '${id}' is not external.`);
          return;
        }

        if (info === true) {
          logger.debug(`[resolveId] '${id}' is externalized.`);
          // 挡住二次解析的是 external 本身，'absolute' 只管输出形态：rolldown 1.2.16
          // PartialResolvedId.external 逐字为 "If 'absolute', absolute ids will always be
          // kept as absolute ids"，而 true 会把绝对路径 id 按 makeAbsoluteExternalsRelative
          // 改写成相对路径写进产物。这里返回的 id 是用户原样写的说明符（裸名 / 绝对 URL），
          // 两种写法实测产物逐字节相同；选 'absolute' 是为了万一 externals 函数命中
          // 绝对文件路径时输出形态不被改写。
          return { id, external: 'absolute' };
        }

        // info === true 时前面已 return，此处 info 一定是 ExternalIIFE | ExternalES 形态。
        const env = this.environment;

        // 判断当前阶段：build 阶段可能 environment.mode==='build'，
        // 也可能干脆没有 environment；兜底用之前 ConfigEnv 记录的 command。
        const mode = env.mode ?? resolvedOptions.command;

        if (mode === 'build') {
        // ES 链接 → 直接 external:true，产物保留裸 import。
          if (info.format === 'es') {
            logger.debug(`[resolveId] '${id}' => URL: '${info.url}'.`);
            return { id: resolvedOptions.importmap ? id : info.url, external: 'absolute' };
          }

          // IIFE 全局变量 → 解析到 stash 文件路径。Rolldown 把一行 CJS shim
          // 当作普通模块打包进去。
          logger.debug(`[resolveId] '${id}' => Path: '${info.stashPath}'.`);
          return info.stashPath;
        }

        // dev 阶段。
        const depsOptimizer = (env as unknown as DevEnvironment).depsOptimizer;
        if (!depsOptimizer) {
        // 兜底：没有 DepsOptimizer（SSR / 测试环境）时直接返回 stash 路径。
          return info.stashPath;
        }

        // 把 stash 文件包成"新发现的依赖"。Vite 后续把它当成普通优化依赖：
        // 写入 deps cache 目录、仅在 stash 内容变更时重预打包、用 ESM interop
        // 头返回，保证 'import React from 'react'' 仍能拿到 default。
        const depInfo = depsOptimizer.registerMissingImport(id, info.stashPath);
        const depId = depsOptimizer.getOptimizedDepId(depInfo);

        logger.debug(`[resolveId] '${id}' => OptimizedDepId: '${depId}'`);
        return depId;
      }
    }
  };
}

function isGlobalFormat(format?: ModuleFormat) {
  return format === 'iife' || format === 'umd';
}

/**
 * 本次构建实际会产出的 format 列表。
 *
 * 必须复刻 Vite build 阶段的 resolveBuildOutputs，否则门控只看 output：
 *   - lib 存在且 output 不是数组 → 实际 output 由 lib.formats 展开（output.format
 *     被覆盖），缺省单入口 ['es','umd']、多入口 ['es','cjs']；
 *   - output 是数组 → lib.formats 被忽略，按各条目自身的 format；
 *   - 无 lib → 按 output 自身。
 */
function outputFormats(build: NonNullable<UserConfig['build']>): ModuleFormat[] {
  const output = build.rolldownOptions?.output;
  const lib = build.lib;

  if (lib && !Array.isArray(output)) {
    if (lib.formats) {
      return lib.formats;
    }
    const { entry } = lib;
    const multipleEntries = typeof entry !== 'string' && !!entry && Object.values(entry).length > 1;
    return multipleEntries ? ['es', 'cjs'] : ['es', 'umd'];
  }

  if (!output) {
    return [];
  }
  return (Array.isArray(output) ? output : [output]).flatMap((o) => o.format ?? []);
}

export function createConfigPlugin(ctx: PluginContext, opts: Options): Plugin {
  return {
    name: PLUGIN_CONFIG_NAME,
    enforce: opts.enforce ?? 'post',
    apply: opts.apply ?? defaultApply,
    config(config: UserConfig, env: ConfigEnv) {
      const resolvedOptions = buildOptions(opts, env);
      const resolver = new Resolver(resolvedOptions.cacheDir, resolvedOptions.cwd);

      // 纯构建 external 判断链，不改动用户 config。
      const setup = setExternals(resolver, resolvedOptions, config);
      ctx.resolver = resolver;
      ctx.options = resolvedOptions;
      ctx.externalsSetup = setup;

      // 只配 build.lib.formats: ['iife' | 'umd'] 的构建，output 里没有 format，
      // 但 Vite 会用 lib.formats 展开；漏判会清掉原生 external，
      // 误退回 stash shim 路线（示例 6/9/13 即此形态）。
      const isGlobal = config.build ? outputFormats(config.build).some(isGlobalFormat) : false;
      const enabled = opts.interop !== 'auto' && isGlobal;

      /*
       * external 只通过返回值声明式覆盖，不就地写用户 config。
       *
       * 未启用时返回恒 false 的函数：用户自配的 build.rolldownOptions.external 已在
       * setExternals 里 warn 过，这里用返回值把它盖掉。"忽略"不能靠把入参赋成
       * undefined —— 那既是就地写入，又会在 config 对象被复用时不可逆地抹掉用户原值，
       * 且第二遍不会再 warn。
       *
       * output.globals 不放这里：build.rolldownOptions.output 允许多个输出，而
       * mergeConfig 对数组是 concat，返回值里带数组会拼出重复 output。
       * 它由下面的 outputOptions 钩子逐个 output 安装。
       */
      const rolldownOptions: Rolldown.RolldownOptions = {
        external: function (id: string, importer: string | undefined, isResolved: boolean) {
          return enabled && !!setup.externalFn(id, importer, isResolved);
        }
      };

      return {
        optimizeDeps: {
          rolldownOptions: {
            plugins: setOptimizeDeps(resolver, ctx)
          }
        },
        build: { rolldownOptions }
      };
    },

    /**
     * output.globals 逐个 output 安装，仅对 iife/umd 生效。
     *
     * Rolldown 对每个输出各调一次本钩子：lib.formats 展开出的每种 format、以及用户
     * 自己配成数组的每一项，都在这里被单独处理。因此数组形态天然被覆盖，也不会像
     * config 返回值那样被 mergeConfig 的数组 concat 拼出重复 output。
     *
     * 只给 global format 装 globals：es/cjs 用 import/require，不消费 globals，装了
     * 也只是空转（多一次函数调用和 debug 日志）。与 config 钩子里 external 的
     * enabled 门控保持一致。format 在到达本钩子前已由 Vite 的 resolveBuildOutputs /
     * buildOutputOptions 填成具体值（lib.formats 展开时逐项带 format，未写的补 'es'），
     * 所以这里能可靠判定。
     * 只返回新对象或 null，不动用户 config。
     */
    outputOptions(outputOptions: Rolldown.OutputOptions) {
      const setup = ctx.externalsSetup;
      if (!setup || !isGlobalFormat(outputOptions.format)) {
        return null;
      }
      return {
        ...outputOptions,
        globals: createGlobalsFn(setup.globalObject, outputOptions.globals)
      };
    },

    closeServer() {
      ctx.resolver.scheduleFlushMetadata.flush();
    },

    configureServer(server: ViteDevServer) {
      ctx.devServer = server;
    },

    configResolved(config) {
      logger.debug('[configResolved] Resolved rolldownOptions:', config.build.rolldownOptions);

      /*
       * 清理 Vite deps 缓存里的旧条目 —— 仅 dev
       * Clear stale Vite deps entries — dev only
       *
       * 为什么只认 serve：build 不走 DepsOptimizer，deps 缓存与产物无关，此时去读写
       * .vite/deps/_metadata.json 纯属副作用。build 的 external 由 resolveId 决定；
       * iife/umd 输出还会叠加 rolldown external + output.globals，es/cjs 输出则清空
       * 原生 external、统一走 stash shim。
       * Dev only: build never runs DepsOptimizer, and its externals are decided by
       * resolveId (plus rolldown external/output.globals only for iife/umd output).
       *
       * 名单 = 上次名单 ∪ 本次静态名单：
       *   1. 自建 metadata 的 keys —— 上次运行被 external 过、Vite 缓存里可能还留着条目的模块；
       *   2. externals 为 plain object 时本次配置的 keys —— 补上"本次新增"的模块，
       *      它们在上一份名单里并不存在，只能当场算。
       * 函数形态算不出静态名单，新增项要等下一次启动才进入名单被清理。
       * The union covers newly added modules; a function-form `externals` cannot be
       * enumerated, so additions are only cleaned on the next start.
       */
      if (config.command === 'serve') {
        const { externals } = ctx.options;
        const deps = Object.keys(ctx.resolver.loadMetadata());
        if (isPlainObject(externals)) {
          deps.push(...Object.keys(externals));
        }
        cleanupCache([...new Set(deps)], config);
      }
    },

    transformIndexHtml(html: string): IndexHtmlTransformResult | undefined {
      /*
       * 标签只在 build 阶段注入。
       * dev 的 ES external 由 DepsOptimizer 预打包成本地模块，Vite 自己负责
       * preload；这里的 modulepreload / importmap 只服务于 build 产物首屏。
       */
      if (ctx.options.command === 'serve') {
        return;
      }

      const { resolver } = ctx;
      const tags: HtmlTagDescriptor[] = [];
      const imports: string[] = [];

      resolver.stashMap.forEach((info) => {
        if (info.format !== 'es') {
          return;
        }
        tags.push({
          tag: 'link',
          attrs: {
            rel: 'modulepreload',
            crossorigin: 'anonymous',
            href: info.url
          },
          injectTo: 'head'
        });
        imports.push(`"${info.moduleId}": "${info.url}"`);
      });

      if (ctx.options.importmap && imports.length > 0) {
        tags.push({
          tag: 'script',
          attrs: {
            type: 'importmap'
          },
          children: `{ "imports": { ${imports.join(',')} } }`,
          injectTo: 'head'
        });
      }
      if (tags.length > 0) {
        return { html, tags };
      }
    }
  };
}

/**
 * apply / enforce 是插件级字段：Vite 在 config 钩子执行前就要用它们决定插件是否启用、
 * 排在哪个 enforce 段，所以只能在工厂阶段定值，不能等 buildOptions() 合并模式覆盖。
 *
 * - apply    ：两个插件都带，缺省排除 preview（defaultApply），其余场景照常启用。
 * - enforce  ：只给 config 插件（缺省 'post'，保证在其他改写用户配置的插件之后执行）；
 *              解析插件固定 'pre'，让 external 判定抢在通用解析器之前，不受本选项影响。
 */
export default function v8(opts: Options): Plugin[] {
  const ctx: PluginContext = {
    // 这些字段在 config / configureServer 钩子里填充，创建时先占位。
    options: undefined!,
    resolver: undefined!,
    devServer: undefined!,
    externalsSetup: undefined!,

    /**
     * client 环境的 depsOptimizer 统一经此 getter 读取。
     *
     * devServer 由 configureServer 钩子注入，正常应早于预构建插件的执行；若访问时
     * 仍为空，说明调用时机早于预期，告警后降级为 undefined —— 两处调用方都已用
     * 可选链兜底，降级只会让 metadata/extensions 参与的判断跳过，不中断流程。
     */
    get depsOptimizer() {
      if (!this.devServer) {
        logger.warn(
          'vite-plugin-external: depsOptimizer accessed before devServer was set; '
          + 'returning undefined.'
        );
        return undefined;
      }
      return this.devServer.environments.client.depsOptimizer;
    }
  };
  return [
    createConfigPlugin(ctx, opts),
    createResolvePlugin(ctx, opts)
  ];
}
