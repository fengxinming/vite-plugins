import { prefixRegex } from '@rolldown/pluginutils';
import type { Rolldown } from 'vite';
import { isCSSRequest } from 'vite';

import {
  ROLLDOWN_CONVERSION_PLUGIN_NAME,
  ROLLDOWN_PLUGIN_ASSET_NAME,
  ROLLDOWN_PLUGIN_ENTRY_NAME,
  ROLLDOWN_PLUGIN_METADATA_NAME,
  ROLLDOWN_PLUGIN_NAME
} from '../common/constants';
import { logger } from '../common/logger';
import { Resolver } from '../common/Resolver';
import type { PluginContext } from '../types/_context';

/**
 * CSS Module 请求判定（*.module.css / *.module.less 等），与 vite 的
 * isModuleCSSRequest 行为对齐：模块化 CSS 要走 ESM 重导出 shim（default 导出是
 * 类名映射对象），只有普通 CSS 才是裸 import。
 * Mirrors vite's isModuleCSSRequest: module CSS must go through the ESM re-export
 * shim (its default export is the class-map object); only plain CSS becomes a bare import.
 */
const moduleCssRE = /\.module\.(?:css|less|sass|scss|styl|stylus|pcss|postcss)(?:\?.*)?$/;

function isModuleCSSRequest(id: string): boolean {
  return moduleCssRE.test(id);
}

/**
 * 预打包阶段需要单独处理的资源类型（对齐 vite 的 externalTypes 思路）。
 *
 * 这些 id 可能是相对路径（'./x.css'），只靠"裸包名"维度过滤会漏掉它们，
 * 纯 external 的相对 CSS 就会被 filter 拦掉、外部化失效。
 * These ids may be relative paths, so a bare-specifier-only filter would miss them.
 *
 * 清单与 vite 的 externalTypes + KNOWN_ASSET_TYPES 逐项对齐，两处刻意的写法差异：
 *   1. 不含 js / mjs / cjs / json —— 这些是预打包的本职（vite 用 JS_TYPES_RE 把它们
 *      拉回正常流程），放进 filter 会让每一条相对 .js 导入都空跑一次判定。
 *   2. vite 把 KNOWN_ASSET_TYPES 写成 'jpe?g'、'woff2?' 这类正则片段；这里展开成
 *      字面量后缀，命中的文件类型集合完全相同，而且字面量才能参与下面的
 *      optimizeDeps.extensions 减法（vite 那版对 'jpe?g' 永远减不掉）。
 */
const externalTypes = [
  // css 及预处理器
  'css',
  'less',
  'sass',
  'scss',
  'styl',
  'stylus',
  'pcss',
  'postcss',
  'wasm',
  // SFC / 需自定义编译的类型
  'vue',
  'svelte',
  'marko',
  'astro',
  'imba',
  'jsx',
  'tsx',
  // images
  'apng',
  'bmp',
  'png',
  'jpg',
  'jpeg',
  'jfif',
  'pjpeg',
  'pjp',
  'gif',
  'svg',
  'ico',
  'webp',
  'avif',
  'cur',
  'jxl',
  // media
  'mp4',
  'webm',
  'ogg',
  'mp3',
  'wav',
  'flac',
  'aac',
  'opus',
  'mov',
  'm4a',
  'vtt',
  // fonts
  'woff',
  'woff2',
  'eot',
  'ttf',
  'otf',
  // other
  'webmanifest',
  'pdf',
  'txt'
];

const externalTypesReg = new RegExp(`\\.(${externalTypes.join('|')})(\\?.*)?$`);

/**
 * 用户通过 optimizeDeps.extensions 声明"这种后缀也要预打包"时，它就不该再被
 * 当作外部资源 —— vite 在构造资源正则时把这些类型减掉（rolldownDepPlugin.ts 的
 * allExternalTypes）。我们的 filter 必须在插件构造期定死，而那时还拿不到 resolved
 * config，所以减法放在 handler 里，结果与 vite 一致。
 */
function isOptimizableByExtensions(id: string, extensions: string[]): boolean {
  const withoutQuery = id.split('?')[0];
  const dotIndex = withoutQuery.lastIndexOf('.');
  if (dotIndex === -1) {
    return false;
  }
  return extensions.includes(withoutQuery.slice(dotIndex));
}

/**
 * 裸依赖说明符维度（react / @scope/foo / react-dom/client）。
 * Bare dependency specifiers.
 */
const bareSpecifierIdReg = /^[\w@][^:]/;

/**
 * 预打包入口维度：vite 传入的 rolldown input 是绝对路径。
 * Optimizer entries arrive as absolute file paths.
 */
const optimizerEntryIdReg = /^[/\\]/;

const externalWithConversionNamespace
  = 'vite:dep-pre-bundle:external-conversion';
const convertedExternalPrefix = 'vite-dep-pre-bundle-external:';

/**
 * 分隔符归一：Windows 下 vite 会把 input 值换成反斜杠形态（node.js:28773），
 * 而 metadata 里的 src 恒为 normalizePath 后的正斜杠形态。
 */
function normalizeSep(id: string): string {
  return id.replace(/\\/g, '/');
}

/**
 * 从 vite 自己的依赖记录里取「入口绝对路径 → 原始说明符」的反查表。
 *
 * 只读 metadata.optimized ∪ metadata.discovered 的 {id, src} 配对：
 *   - optimized：本轮之前已确定的依赖（含上次启动缓存下来的）；
 *   - discovered：本轮新发现的，手工 optimizeDeps.include 在预构建启动前
 *     就在这里（node.js:35951-35959）。
 * 不重算 flattenId：metadata 里的 {id, src} 就是 vite 自己写入的权威配对，直接反查
 * 即可；自己再拍一遍只是把"两份规则必须永远一致"变成新的隐式依赖。
 * 本包的 flattenId（vp-runtime-helper/depsCache）已对齐 vite 8，但仍不作为入口识别依据。
 */
function collectEntrySpecifiers(ctx: PluginContext): Map<string, string> {
  const map = new Map<string, string>();
  const metadata = ctx.depsOptimizer?.metadata;
  if (!metadata) {
    return map;
  }

  for (const record of [metadata.optimized, metadata.discovered]) {
    for (const { id, src } of Object.values(record)) {
      if (src) {
        map.set(normalizeSep(src), id);
      }
    }
  }
  return map;
}

/**
 * 协议插件 —— 只负责纯 external 的两段式转换，不参与"是不是 external"的判定。
 *
 * 为什么拆成独立插件（对齐 vite 自己的 vite:dep-pre-bundle-assets 拆分）：
 * 协议 id 和"依赖说明符"是两个不同的判定维度，分开后各自的 filter 只服务一件事。
 * 注意这不代表 vite 的 dep-pre-bundle 插件（filter /^[\w@][^:]/）看不到我们的协议
 * id —— 'vite-dep-pre-bundle-external:react' 首字符是 \w、次字符不是 ':'，它同样
 * 命中那条 filter。真正让我们先拿到结果的是 resolveId 的 order: 'pre'；vite 的
 * handler 收到这种 id 只会解析失败后返回 undefined，不会改写。
 *
 * 两段式流程（vite 自己的协议，两条分支各走一半）：
 *   1. 判定插件判为纯 external → 直接返回 EXTERNAL_PREFIX + id；本插件的 resolveId
 *      命中该前缀后剥掉并标 external: 'absolute'。
 *   2. CONVERSION 前缀只由 vite 自己的 vite:dep-pre-bundle-assets 产生（require-call
 *      形态的资源导入）；我们的插件容器排在 vite 之前（vite 的 index.ts 先 push
 *      pluginsFromConfig 再 push rolldownDepPlugin），所以这类 id 的 load 由我们接走，
 *      生成的 shim 与 vite 自身那份等价。
 *
 * 为什么不能省掉第二段前缀：load 生成的 shim 里若直接写 'export * from "react"'，
 * rolldown 会再次 resolve 'react' → 又落回纯 external 判定 → 无限循环。
 *
 * 为什么用 id 前缀而不是 resolveId 的 namespace 字段：
 *   rolldown 的 load 钩子只传 id（实测 argc=1，moduleInfo.meta 为空），
 *   namespace 字段既不会传给 load，也无法从 moduleInfo.meta 读到；
 *   vite 自身的约定也是把命名空间编码进 id 前缀。
 */
function conversionPluginForExternals(): Rolldown.Plugin {
  return {
    name: ROLLDOWN_CONVERSION_PLUGIN_NAME,

    // case (a) — 带 EXTERNAL 前缀的 id 是 load 生成的 shim 内部 import，
    // 剥掉前缀直接标 external，保留原始说明符形态。
    resolveId: {
      order: 'pre',
      filter: {
        id: prefixRegex(convertedExternalPrefix)
      },
      handler(id: string) {
        return {
          id: id.slice(convertedExternalPrefix.length),
          // 'absolute'：id 已最终化，别再二次解析（与 vite 的 external 分支一致）。
          external: 'absolute'
        };
      }
    },

    // case (b) 的配对处理：生成 ESM 重导出 shim。
    // load 只收 id，所以用前缀判定"这是我的转入模块"，再剥离出原始 id。
    load: {
      filter: {
        id: prefixRegex(externalWithConversionNamespace)
      },
      handler(id) {
        const path = id.slice(externalWithConversionNamespace.length);
        // import itself with prefix (this is the actual part of require-import conversion)
        const modulePath = `"${convertedExternalPrefix}${path}"`;
        return {
          code:
              isCSSRequest(path) && !isModuleCSSRequest(path)
                ? `import ${modulePath};`
                : `export { default } from ${modulePath};`
                  + `export * from ${modulePath};`
        };
      }
    }
  };
}

/**
 * 入口维度插件 —— 把 optimizeDeps.include 里的 external 在预打包阶段就换成 stash shim。
 *
 * 为什么必须单独处理入口？
 * vite 用**自己的内部 resolver**（不经过任何用户插件钩子）把 optimizeDeps.include
 * 解析成 node_modules 绝对路径，再作为 rolldown 的 input 传进预打包构建
 * （vite 8.3.5 node.js:28846-28873 → 28768-28773）。也就是说 `@vitejs/plugin-react`
 * 一旦把 react 塞进 include，react 就是**入口模块**而不是 bundle 内部的裸说明符，
 * 说明符维度的判定永远看不到 'react' 这个字符串；dev 阶段用户声明的 external
 * 于是被静默忽略（浏览器拿到的是本地预打包的真实 React）。
 *
 * 入口 id 是绝对路径，判定需要说明符，所以用 vite 自己维护的 {说明符 ↔ src} 配对反查：
 * metadata.optimized / metadata.discovered 里每条都带这两个字段，且手工 include 在
 * 预构建启动前就已写进 discovered（node.js:35951-35959）。**不重算 flattenId** ——
 * 直接用 vite 写入的配对，避免再引入一份"必须永远跟住 vite"的隐式依赖。
 *
 * 纯 external（Resolver.resolve() 返回 true）在这里无法生效：入口必须产出 chunk，
 * 标 external 的模块不会生成 deps 文件。此时保持 vite 的默认行为（原样打包），
 * 与改动前一致，不做破坏性处理。
 */
function entryPluginForExternals(
  resolver: Resolver,
  ctx: PluginContext,
): Rolldown.Plugin {
  let entrySpecifiers: Map<string, string> | undefined;

  return {
    name: ROLLDOWN_PLUGIN_ENTRY_NAME,

    /*
     * 每轮预构建重算一次：discovered 会在运行期追加新的 missing 依赖，
     * 而 buildStart 正好是"本轮 input 已定、尚未开始解析"的时点。
     */
    buildStart() {
      entrySpecifiers = collectEntrySpecifiers(ctx);
      logger.debug(`[${ROLLDOWN_PLUGIN_ENTRY_NAME}] Entry specifiers:`, [...entrySpecifiers.values()]);
    },

    resolveId: {
      order: 'pre',
      filter: {
        id: optimizerEntryIdReg
      },
      async handler(id: string, importer: string | undefined, extra: Rolldown.ResolveIdExtraOptions) {
        if (!extra.isEntry) {
          return null;
        }

        const specifier = entrySpecifiers?.get(normalizeSep(id));
        if (!specifier) {
          return null;
        }

        const info = await resolver.resolve(specifier, importer, extra);
        if (!info) {
          return null;
        }

        if (info === true) {
          // 入口不能标 external：external 的模块不会生成 deps chunk。
          logger.debug(`[${ROLLDOWN_PLUGIN_ENTRY_NAME}] Entry '${specifier}' is pure external, left as-is.`);
          return null;
        }

        logger.debug(`[${ROLLDOWN_PLUGIN_ENTRY_NAME}] Pre-bundling entry '${specifier}' => '${info.stashPath}'.`);
        return {
          id: info.stashPath
        };
      }
    }
  };
}

/**
 * 判定命中后的统一下发形态，供裸说明符与资源后缀两个维度共用。
 *
 * 三种可能结果：
 *   (a) Resolver.resolve() 返回 false → 不是 external，返回 null 交给 Rolldown 常规解析。
 *   (b) Resolver.resolve() 返回 true → 纯 external，没有 stash 文件。
 *       不能简单 return {external:'absolute'}，因为 CSS import 和
 *       import * as X from 'X' 在预打包后会丢失命名空间形状导致出错。
 *       所以交给协议插件走两段式转换（CONVERSION → load → EXTERNAL）。
 *   (c) Resolver.resolve() 返回 stash info（IIFE / ES 格式）→
 *       直接把预打包器重定向到 stash 文件路径 info.stashPath。
 *       这里不标 external，因为 stash 文件本身是真实 JS 文件，Rolldown 会正常打包它。
 */
async function resolveDependencyExternals(
  resolver: Resolver,
  pluginName: string,
  id: string,
  importer: string | undefined,
  extra: Rolldown.ResolveIdExtraOptions,
) {
  const info = await resolver.resolve(id, importer, extra);

  // 不是 external → 让 Rolldown 按常规流程解析。
  if (!info) {
    return null;
  }

  // case (b) — 纯 external，交给协议插件走两段式转换。
  if (info === true) {
    logger.debug(`[${pluginName}] Pre-bundling: '${id}' will be externalized (pure external).`);
    return {
      id: convertedExternalPrefix + id
    };
  }

  // case (c) — 基于 stash 的命名 external / CDN external。记录日志分类，
  // 然后把解析目标重定向到 stash 路径。
  logger.debug(`[${pluginName}] Pre-bundling ${info.format} external:`, {
    externalName: info.format === 'iife' ? info.globalName : info.url,
    moduleId: info.moduleId,
    stashPath: info.stashPath,
    extra
  });

  return {
    id: info.stashPath
  };
}

/**
 * 说明符维度插件 —— 回答"这个 id 是不是 external、external 到哪里"。
 * 裸说明符与资源后缀各挂一个 filter，共用同一份判定与下发逻辑。
 *
 * 为什么需要这个插件？
 * DepsOptimizer 会预打包 optimizeDeps.include 列表 + 运行时动态发现的
 * missing import。当用户声明了 externals: {react:'React'} 后，预打包器仍然
 * 需要知道：
 *   - import 'react' 需要 bundle 吗？→ 不需要（external） 或 需要（打包 stash shim）
 *   - 如果 bundle，读哪个源代码？ → 读本插件写的 stash 文件
 * 没有这个插件，Rolldown 会试图去 node_modules 找 react，用户没装就直接报错。
 */
function specifierPluginForExternals(
  resolver: Resolver,
  pluginName: string,
  idReg: RegExp,
  ctx: PluginContext,
  skipIf?: (id: string, extensions: string[]) => boolean,
): Rolldown.Plugin {
  return {
    name: pluginName,

    resolveId: {
      order: 'pre',
      /*
       * filter：一个插件只挂一个维度（裸说明符 react / @scope/foo / react-dom/client，
       * 或资源类型 ./x.css）。绝对路径入口不在这里——那是入口插件的事。
       * 协议插件的 convertedExternalPrefix id 其实也会命中裸说明符这条 filter
       * （'vite-dep-pre-bundle-external:react' 首字符是 \w），它靠协议插件同样的
       * order: 'pre' + 更靠前的注册顺序先被接走，这里不必再防。
       */
      filter: {
        id: idReg
      },
      async handler(id: string, importer: string | undefined, extra: Rolldown.ResolveIdExtraOptions) {
        if (skipIf) {
          const extensions = ctx.depsOptimizer?.options.extensions;
          if (extensions && skipIf(id, extensions)) {
            return null;
          }
        }
        return resolveDependencyExternals(resolver, pluginName, id, importer, extra);
      }
    }
  };
}

/**
 * 生命周期维度插件 —— 在预构建结束时记下本轮 external 名单，并兜底落盘。
 *
 * 名单落盘仍由"stash() 产出新条目"排程（Resolver.scheduleFlushMetadata），本钩子不是前提：
 * 零条目早退、optimizeDeps.noDiscovery 这些场景压根不建容器，靠它写盘就会丢名单。
 * 这里只做一件事 —— 把还没到期的那一次防抖 `.flush()` 掉：容器都跑完了还不落盘，
 * 进程随后被杀（dev 重启、测试收尾）就来不及写；本轮没排程时 flush() 不写任何字节，
 * 所以空轮不会把上一轮的名单抹成空快照。
 * Why it exists: the schedule stays bound to stash() so rounds without a container can't lose
 * the list; this hook only pre-empts a pending write, and writes nothing when nothing is pending.
 */
function metadataPluginForExternals(resolver: Resolver): Rolldown.Plugin {
  return {
    name: ROLLDOWN_PLUGIN_METADATA_NAME,
    buildEnd() {
      logger.debug(`[${ROLLDOWN_PLUGIN_METADATA_NAME}] Pre-bundling externals:`, Array.from(resolver.stashMap.keys()));
      resolver.scheduleFlushMetadata.flush();
    }
  };
}

/**
 * 本插件注入到预打包的全部 Rolldown 插件：按"一个 id 维度 = 一个插件 = 一个 filter 正则"
 * 拆开，末尾再挂一个不参与判定的生命周期插件（buildEnd 记本轮名单日志，并兜底 flush 待落盘的写）。
 */
function pluginsForExternals(
  resolver: Resolver,
  ctx: PluginContext,
): Rolldown.Plugin[] {
  return [
    conversionPluginForExternals(),
    entryPluginForExternals(resolver, ctx),
    specifierPluginForExternals(resolver, ROLLDOWN_PLUGIN_NAME, bareSpecifierIdReg, ctx),
    specifierPluginForExternals(
      resolver,
      ROLLDOWN_PLUGIN_ASSET_NAME,
      externalTypesReg,
      ctx,
      isOptimizableByExtensions
    ),
    metadataPluginForExternals(resolver)
  ];
}

/**
 * 返回要注入 optimizeDeps.rolldownOptions.plugins 的 Rolldown 插件。
 *
 * 由 config 钩子通过返回值交付给 Vite，不再就地写入用户 config：
 * Vite 每轮 resolveConfig 都构造新的 config，dev 重启因此不会在同一对象上堆积插件。
 * 用户已有的插件由 Vite 的 mergeConfig 负责合并（我们排在末尾）。
 */
export function setOptimizeDeps(
  resolver: Resolver,
  ctx: PluginContext,
): Rolldown.Plugin[] {
  return pluginsForExternals(resolver, ctx);
}
