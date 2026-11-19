import { readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

import type { DebouncedFunction } from 'es-toolkit';
import { debounce } from 'es-toolkit';
import { outputFile, outputFileSync } from 'fs-extra/esm';
import { isAbsoluteURL } from 'is-what-type';
import { normalizePath, type Rolldown } from 'vite';
import { flattenId } from 'vp-runtime-helper';

import type { ExternalES, ExternalIIFE, ExternalMetadata } from '../types/_resolverInfo';
import type {
  ExternalEsConfig,
  ExternalEsExports,
  ExternalFn,
  ResolveIdExtraOptions
} from '../types/deps';
import { METADATA_FLUSH_DEBOUNCE_MS } from './constants';
import { ExternalError } from './ExternalError';
import { logger } from './logger';

/**
 * 判定 externals 的返回值 / Record 值是不是 ES 声明对象。
 *
 * 只认 format 判别字段；url、exports 是否合法由 normalizeEsConfig 校验，
 * 校验失败直接抛错，避免把非法配置静默写成坏 shim。
 */
export function isExternalEsConfig(value: unknown): value is ExternalEsConfig {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const { format } = value as { format?: unknown };
  return format === 'es';
}

/**
 * 把库名（可能包含子路径 /）转换为 stash 文件的磁盘绝对路径。
 * 使用 flattenId 是为了把 react-dom/client 这种子路径拍平成单个合法文件名
 * （react-dom_client.js），避免在 cacheDir 里生成嵌套目录。
 */
function makeStashFilePath(cacheDir: string, libName: string): string {
  return join(cacheDir, `${flattenId(libName)}.js`);
}

/**
 * IIFE 全局变量形态的 stash 文件内容模板（如 {react:'React'}）。
 *
 * 为什么用 CJS（module.exports = React;）而不是 ESM export default？
 * 经过多次迭代后这个写法在两条路线上都稳定：
 *   1. Dev 阶段的 DepsOptimizer 预打包：Rolldown 会对它做 CJS→ESM 互操作包装，
 *      import React from 'react' 仍然拿到 default 导出。
 *   2. Build 阶段走 stash 解析：Rolldown 看到 module.exports = X 就知道
 *      整个模块只有一个 default 导出，与 IIFE 全局变量的形态完全一致。
 * 如果改成 ESM export default，IIFE build 时 Rolldown 可能把它当成命名导出模块，
 * 跟用户预期的 window.React 形状不匹配，部分边界场景会出错。
 */
function makeCjsExternalCode(globalName: string): string {
  return `module.exports = ${globalName};`;
}

/**
 * ES 链接形态的 stash 文件内容模板，按导出模式分支。
 *
 * - auto   ：目标没有 default 时，`export { default } from` 会在加载期直接报错
 *            （"does not provide an export named 'default'"）。改成命名空间取值后
 *            default 只会是 undefined，任何模块都能加载。
 * - named  ：只转发命名导出，适合确定没有 default 的目标。
 * - default：只转发 default。
 * - none   ：纯副作用导入，不导出任何名字。
 */
function makeEsExternalCode(link: string, exports: ExternalEsExports): string {
  switch (exports) {
    case 'named':
      return `export * from '${link}';`;
    case 'default':
      return `export { default } from '${link}';`;
    case 'none':
      return `import '${link}';`;
    case 'auto':
      return `import * as ns from '${link}';\nexport default ns.default;\nexport * from '${link}';`;
  }
}

/** `/`、`./`、`../` —— 能直接当 URL 使用的相对路径前缀。 */
const RELATIVE_URL_PREFIX = /^\.{0,2}\//;

/** 只有 `./`、`../` 需要重新定基：它们相对 cwd，而 shim 写在 cacheDir 里。 */
const CWD_RELATIVE_PREFIX = /^\.\.?\//;

/**
 * 判断 externals 的字符串值该走 ES 链接路线，还是当作全局变量名。
 *
 * 判定标准：有效的绝对 URL，或以 /、./、../ 开头的有效 URL 字符串。
 * isAbsoluteURL 只认 `scheme://` 和协议相对 `//`，漏掉相对路径后这些值会落进
 * IIFE 分支，写出 `module.exports = ./x.js;` 这种非法 shim，必须在这里补上。
 * 相对串需要 base 才能交给 URL 解析器校验，base 只用于判形态，不参与后续逻辑。
 */
function isUrlString(value: string): boolean {
  return isAbsoluteURL(value)
    || (RELATIVE_URL_PREFIX.test(value) && URL.canParse(value, 'file:///'));
}

/**
 * 把用户声明的相对链接换算成 stash 文件里可解析的说明符。
 *
 * 用户写 `./src/x.ts` 时基准是 cwd（配置根目录），而 shim 落在 cacheDir 内，
 * 原样写入会相对 shim 自己解析而找不到文件。处理顺序对齐 Vite 的 deps metadata：
 * 先在内存里落到绝对路径，写盘时再表达成相对 cacheDir 的路径
 * （vite: stringifyDepsOptimizerMetadata 用 path.relative(depsCacheDir, value)）。
 */
function makeStashLink(link: string, cwd: string, stashDir: string): string {
  const specifier = normalizePath(relative(stashDir, resolve(cwd, link)));
  return specifier.startsWith('.') ? specifier : `./${specifier}`;
}

const ES_EXPORT_MODES = ['auto', 'named', 'default', 'none'] as const satisfies readonly ExternalEsExports[];

/**
 * 补全并校验 ES 声明对象：url 必填，exports 缺省 auto。
 *
 * 非法配置直接抛错，避免把坏配置静默写成不可加载的 shim。
 */
function normalizeEsConfig(
  libName: string,
  value: ExternalEsConfig,
): ExternalEsConfig {
  if (!value.url) {
    throw new ExternalError(
      `externals '${libName}': "format: 'es'" requires a non-empty "url".`,
    );
  }
  const exports = value.exports ?? 'auto';
  if (!ES_EXPORT_MODES.includes(exports)) {
    throw new ExternalError(
      `externals '${libName}': unknown "exports" value '${String(exports)}'. `
      + `Expected one of: ${ES_EXPORT_MODES.join(', ')}.`,
    );
  }
  return { ...value, exports };
}

/**
 * 无状态的 stash 写入辅助函数，仅由 Resolver.stash() 调用。
 *
 * 执行步骤：
 *   1. 把 libName 转成 stash 文件绝对路径（makeStashFilePath）。
 *   2. 字符串保留旧语义：URL → es（exports 默认 auto），否则 → iife 全局名；
 *      声明对象一律是 ES 对象，由 normalizeEsConfig 补全并校验。
 *   3. es → 按 exports 模式生成重导出 shim（./ ../ 会先按 cwd 解析，再换算成
 *      相对 stash 目录的说明符）；iife → CJS shim 指向 window 全局变量。
 *   4. 用 outputFile 把生成的 JS 代码写盘（自动创建父目录，幂等覆盖）。
 *   5. 返回带类型的 info 对象（ExternalIIFE 或 ExternalES），内含 stashPath、
 *      format 标记、以及原始 url/globalName。format/url/moduleId 由 transformIndexHtml
 *      与预打包日志消费；globalName 只用于日志，output.globals 查的是 handleExternals
 *      另行维护的 globalObject 表，不读这里的 info。
 */
async function stashToDisk(
  libName: string,
  value: string | ExternalEsConfig,
  cacheDir: string,
  cwd: string,
): Promise<ExternalIIFE | ExternalES> {
  const libPath = makeStashFilePath(cacheDir, libName);

  let info: ExternalIIFE | ExternalES;
  let code: string;

  // 字符串保留旧语义：URL → ES，否则 → IIFE 全局名。
  if (typeof value === 'string' && !isUrlString(value)) {
    info = {
      moduleId: libName,
      stashPath: libPath,
      globalName: value,
      format: 'iife'
    };
    code = makeCjsExternalCode(value);
  }
  else {
    const config = normalizeEsConfig(
      libName,
      typeof value === 'string' ? { format: 'es', url: value } : value,
    );
    info = {
      moduleId: libName,
      stashPath: libPath,
      url: config.url,
      format: 'es',
      exports: config.exports ?? 'auto'
    };
    code = makeEsExternalCode(
      CWD_RELATIVE_PREFIX.test(info.url)
        ? makeStashLink(info.url, cwd, dirname(libPath))
        : info.url,
      info.exports,
    );
  }

  logger.trace(`Stashing a file: '${libPath}' for '${libName}'.`);
  await outputFile(libPath, code, 'utf-8');
  return info;
}

/**
 * 整个插件的核心协调器，回答"该 import 是否是 external，若是则解析到哪里？"这一问题。
 *
 * 设计背景：
 * 三个插件入口（dev resolveId、build resolveId、DepsOptimizer 预打包 resolve）
 * 需要共享两份状态：
 *   1. stashMap<string, ExternalIIFE | ExternalES>：已写过磁盘的库映射。
 *      避免同一个库重复写文件；更关键的是让 transformIndexHtml 知道哪些
 *      库是 ES 格式，从而注入 modulepreload 标签。
 *   2. resolveHooks: ExternalFn[]：由用户配置编译出来的判断函数列表，
 *      由 setExternals 在 config 钩子里直接调用 resolver.useHook 注入。
 *
 * 为什么把"磁盘 IO 写入 stash"和"resolve 判断"合并到同一个类？
 * 因为三个入口都会触发这两个操作，如果分开写会：
 *   - 产生三份相同的 stash 文件（IO 浪费）
 *   - transformIndexHtml 拿不到 ES 格式信息
 *   - 最严重：三个入口判断结果可能不一致，导致诡异 bug
 * 单一 Resolver 持有同一对 map + hook 列表，彻底消除上述问题。
 *
 * metadata 的定位（三份状态里最容易搞混的一份）：
 *   _metadata.json 是**给下一次 dev 启动用的名单**，唯一用途是让 cleanupCache 把
 *   Vite deps 缓存里"上次被 external 过"的条目删掉，逼 Vite 重新预构建。
 *   它不参与判定，读写时机分别是：
 *     - 读：configResolved（仅 command === 'serve'）
 *     - 写：stash() 产出新条目后排入 scheduleFlushMetadata（防抖窗口到期落盘），
 *       预构建插件的 buildEnd 再对"尚未到期的那一次"兜底 flush —— 进程在窗口内被杀掉
 *       （dev 重启、单元测试收尾）时名单也不会丢。本轮没 stash 时 buildEnd 不写任何字节。
 *       build 的 interop 路线也会 stash，所以 build 同样可能写这个文件——它只是线索，
 *       写多一次不会改变任何判定，读取方只存在于 serve 启动。
 * The metadata file is a *list for the next dev start*, consumed only by cleanupCache. It
 * never participates in resolution. The only write path is the debounce armed by stash();
 * the optimizer's buildEnd flushes that pending call so a kill inside the window can't
 * lose the list, and writes nothing at all when nothing is pending.
 */
export class Resolver {
  readonly stashMap = new Map<string, ExternalIIFE | ExternalES>();
  /**
   * 延迟写盘：由 stash() 在新条目落盘后调用，窗口内多次 stash 合并成一次写，也是 metadata 唯一的排程入口。
   *
   * 为什么绑在 stash 而不是预构建的 buildEnd：buildEnd 属于 Rolldown 打包容器，这一轮若根本
   * 没建容器（零条目早退、optimizeDeps.noDiscovery 等），它不触发，本轮 external 的线索就丢了，
   * 下一次 dev 启动的 cleanupCache 无从剪枝。绑在"条目产生"这个事实上就不再依赖某条生命周期
   * 是否跑到；buildEnd 只是拿 `.flush()` 把还没到期的那一次提前落盘（兜底），不是写盘的前提。
   * 快照取自当时的整个 stashMap，所以本轮 external 的名字会挤掉磁盘上的旧名字；本轮一个
   * 条目都没产生时防抖没排程、`.flush()` 也不写，遗留的名字会被下一次启动继续剪，
   * 直到某轮重新 stash 才被整份快照覆盖掉。
   * Why it exists: making buildEnd the writer would tie the list to the Rolldown optimizer
   * container, and rounds that never build a container never reach it. Binding the schedule to
   * "an entry was created" removes that dependency; buildEnd only pre-empts a pending call.
   * The snapshot is the whole stashMap, so this round's names replace stale ones; a round that
   * stashes nothing leaves them in place.
   */
  readonly scheduleFlushMetadata: DebouncedFunction<() => void>;

  private readonly resolveHooks: ExternalFn[] = [];

  /** 自建 metadata 文件路径，构造时算一次。 */
  private readonly metadataPath: string;

  constructor(
    private readonly cacheDir: string,
    /** 相对链接的解析基准：./ ../ 由用户按配置根目录书写，与 cacheDir 无关。 */
    private readonly cwd: string = process.cwd(),
  ) {
    this.metadataPath = join(cacheDir, '_metadata.json');
    this.scheduleFlushMetadata = debounce(() => {
      this.flushMetadata();
    }, METADATA_FLUSH_DEBOUNCE_MS);
  }

  /**
   * 读取自建 metadata，返回「模块名 → stash 条目」的记录。**不修改 stashMap**。
   *
   * 职责边界：这里只负责把磁盘上的记录读出来，供 cleanupCache 取模块名去清 Vite deps
   * 缓存里的旧条目。stashMap 只在当前进程内由 resolve() → stash() 填充，不回灌磁盘记录：
   * 回灌会让 resolve() 命中缓存而跳过 hooks，hooks 的判定（以及函数形态里按 importer
   * 分支的结论）就不再参与本轮，等于用上一轮的判定替换本轮配置。
   * Reads the record without touching stashMap. stashMap is filled in-process by
   * resolve() → stash() only: hydrating it from disk would let resolve() short-circuit on
   * stale entries and skip this round's hooks altogether.
   */
  loadMetadata(): Record<string, ExternalIIFE | ExternalES> {
    try {
      const { metadataPath } = this;
      logger.debug(`Loading metadata from: '${metadataPath}'.`);

      const raw = JSON.parse(readFileSync(metadataPath, 'utf-8')) as { externalized?: unknown } | null;
      const { externalized } = raw ?? {};

      /*
       * 只认「模块名 → stash 条目」的对象形态。旧版本写的是字符串数组，
       * 而唯一消费方 cleanupCache 取的是 Object.keys：数组会被读成 ['0','1']，
       * 真正的旧模块名反而清不掉，缓存失效比不读更糟。形态不符一律当空清单。
       * Only a Record shape is accepted: cleanupCache consumes Object.keys, so a legacy
       * string array would be read as indices and silently skip pruning the real entries.
       */
      if (!externalized || typeof externalized !== 'object' || Array.isArray(externalized)) {
        logger.warn('Metadata "externalized" is not a module-name/entry record, treating as an empty list.');
        return {};
      }

      return externalized as Record<string, ExternalIIFE | ExternalES>;
    }
    catch (err) {
      // 文件尚不存在 = 首次运行的正常状态（只有 stash 命中才会创建它），
      // 按空清单降级；真异常（JSON 坏 / 权限）才记 warn。
      if ((err as { code?: string }).code === 'ENOENT') {
        logger.trace('Metadata file does not exist yet, treating as an empty list.');
      }
      else {
        logger.warn('Failed to read metadata:', err);
      }
      return {};
    }
  }

  /**
   * 把当前 stashMap 整体写盘（立即，不防抖），是写盘动作的本体。
   *
   * 生产链路只经 scheduleFlushMetadata 在防抖窗口到期后调用它；单独暴露出来是为了让测试
   * 能在窗口之外拿到确定收口，不必为了读文件而等满 500ms。
   * The disk write itself. Production reaches it only through scheduleFlushMetadata once the
   * debounce window elapses; it stays public so tests can settle without waiting a full window.
   */
  flushMetadata(): void {
    const { metadataPath } = this;
    logger.debug(`Writing metadata to: '${metadataPath}'.`);

    try {
      outputFileSync(metadataPath, JSON.stringify({
        externalized: Object.fromEntries(this.stashMap)
      } satisfies ExternalMetadata, null, 2), 'utf-8');
    }
    catch (err) {
      // 与 cleanupCache 的写盘策略一致：metadata 只是清理线索，
      // 写失败（只读文件系统等）不影响主流程，也不能炸掉进程，但要留日志可查。
      logger.warn('Failed to write metadata:', err);
    }
  }

  /**
   * stash() 的记忆化版本：如果一个库已经写过磁盘，直接返回缓存的 info。
   * 三个入口共享同一个 Resolver 实例，保证每个库永远只写一次磁盘。
   */
  async stash(
    libName: string,
    value: string | ExternalEsConfig,
  ): Promise<ExternalIIFE | ExternalES> {
    const { stashMap } = this;
    const cached = stashMap.get(libName);
    if (cached) {
      logger.trace(`'${libName}' has already been stashed, skipping.`);
      return cached;
    }

    const info = await stashToDisk(libName, value, this.cacheDir, this.cwd);
    stashMap.set(libName, info);

    this.scheduleFlushMetadata();
    return info;
  }

  /**
   * 主判断入口，三个插件入口都调用它。
   *
   * 算法：
   *   1. 先查 stashMap，命中直接返回（同一进程内同一模块只判定一次）。
   *   2. 按插入顺序轮询 resolveHooks：
   *        - 返回 true  → external 且无全局名，调用方自行标 external
   *        - 返回字符串 / 声明对象 → 写/查 stash 文件，返回带类型 info 对象
   *        - 返回 falsy → 继续下一个 hook
   *   3. 全部不命中 → false，不是 external。
   *
   * 短路的已知代价：命中时首个调用方的 (importer, extra) 结论会被后续所有 importer
   * 复用，所以函数形态 externals 里按 importer 分支的判定只对第一个 importer 生效。
   * 短路不会影响 output.globals：globalObject 由 rolldown 原生 external 钩子直接调
   * externalFn 登记（externalFn 由 setExternals 构建，经 config 钩子挂到
   * build.rolldownOptions.external 上），那条链不经过 resolve()；
   * dev 不跑原生 external，也没有 globals 消费者。
   */
  async resolve(
    source: string,
    importer: string | undefined,
    isResolved: boolean | ResolveIdExtraOptions | Rolldown.ResolveIdExtraOptions,
  ): Promise<ExternalIIFE | ExternalES | boolean> {
    const info = this.stashMap.get(source);
    if (info) {
      return info;
    }

    for (const resolveHook of this.resolveHooks) {
      const result = resolveHook(source, importer, isResolved);

      if (result === true) {
        return true;
      }

      if (typeof result === 'string' || isExternalEsConfig(result)) {
        return this.stash(source, result);
      }
    }

    return false;
  }

  /**
   * 注册一个新的 external 判断 hook，追加到列表末尾（后注册后匹配）。
   */
  useHook(hook: ExternalFn): this {
    this.resolveHooks.push(hook);
    return this;
  }
}
