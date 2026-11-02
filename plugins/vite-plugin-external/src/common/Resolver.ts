import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { outputFile } from 'fs-extra';
import { isAbsoluteURL, isPlainObject } from 'is-what-type';
import { Rolldown } from 'vite';
import { flattenId } from 'vp-runtime-helper';

import type { ExternalES, ExternalIIFE, ExternalMetadata } from '../internal-types';
import type { ExternalFn, ResolveIdExtraOptions } from '../types';
import { logger } from './logger';

/**
 * 把库名（可能包含子路径 /）转换为 stash 文件的磁盘绝对路径。
 * 使用 flattenId 是为了把 react-dom/client 这种子路径拍平成单个合法文件名
 * （react-dom__client.js），避免在 cacheDir 里生成嵌套目录。
 */
function makeStashFilePath(cacheDir: string, libName: string): string {
  return join(cacheDir, `${flattenId(libName)}.js`);
}

/**
 * 判断 metadata 里的一条记录是否是合法的 stash 条目。
 *
 * 为什么要校验而不是直接信任：metadata 是磁盘文件，可能来自旧版本（当时
 * externalized 存的是 string[]）或被手工改过；不校验就会把脏数据塞进 stashMap，
 * 让后续 resolve 拿到残缺的 info。
 * Why validate instead of trusting: the file may come from an older version (which
 * stored `externalized: string[]`) or be hand-edited; feeding dirty data into stashMap
 * would hand incomplete info to later resolves.
 */
function isExternalInfo(value: unknown): value is ExternalIIFE | ExternalES {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const { moduleId, stashPath, format } = value as Record<string, unknown>;
  return typeof moduleId === 'string'
    && typeof stashPath === 'string'
    && (format === 'iife' || format === 'es');
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
 * ES CDN 链接形态的 stash 文件内容模板。
 * 简单地从绝对 URL 重导出 default + 所有命名导出，
 * 下游模块看到的就是 CDN 原始模块的导出形态，不会丢失命名导出。
 */
function makeEsExternalCode(link: string): string {
  return `export { default } from '${link}';\nexport * from '${link}';`;
}

/**
 * 无状态的 stash 写入辅助函数，仅由 Resolver.stash() 调用。
 *
 * 执行步骤：
 *   1. 把 libName 转成 stash 文件绝对路径（makeStashFilePath）。
 *   2. 判断 globalName 是否为绝对 URL：是 → ES CDN 重导出；否 → IIFE CJS shim 指向 window 全局变量。
 *   3. 用 outputFile 把生成的 JS 代码写盘（自动创建父目录，幂等覆盖）。
 *   4. 返回带类型的 info 对象（ExternalIIFE 或 ExternalES），内含 stashPath、
 *      format 标记、以及原始 globalName/cdnUrl，后续被 Rolldown output.globals 和
 *      transformIndexHtml 消费。
 */
async function stashToDisk(
  libName: string,
  globalName: string,
  cacheDir: string,
): Promise<ExternalIIFE | ExternalES> {
  const libPath = makeStashFilePath(cacheDir, libName);

  let info: ExternalIIFE | ExternalES;
  let code: string;

  if (isAbsoluteURL(globalName)) {
    info = {
      moduleId: libName,
      stashPath: libPath,
      cdnUrl: globalName,
      format: 'es'
    };
    code = makeEsExternalCode(globalName);
  }
  else {
    info = {
      moduleId: libName,
      stashPath: libPath,
      globalName,
      format: 'iife'
    };
    code = makeCjsExternalCode(globalName);
  }

  logger.trace(`Stashing a file: '${libPath}' for '${globalName}'.`);
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
 *      通过 setExternals 返回 hook 后调用 resolver.useHook 注入。
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
 *   它不参与判定，也不在 build 阶段使用，读写时机分别是：
 *     - 读：configResolved（仅 command === 'serve'）、closeServer(restart)
 *     - 写：预构建插件的 buildEnd
 * The metadata file is a *list for the next dev start*, consumed only by cleanupCache.
 * It never participates in resolution and is untouched during build.
 */
export class Resolver {
  readonly stashMap = new Map<string, ExternalIIFE | ExternalES>();
  private readonly resolveHooks: ExternalFn[] = [];

  /** 自建 metadata 文件路径，构造时算一次。 */
  private readonly metadataPath: string;

  constructor(
    private readonly cacheDir: string,
  ) {
    this.metadataPath = join(cacheDir, '_metadata.json');
  }

  /**
   * 读取自建 metadata，返回「模块名 → stash 条目」的记录。**不修改 stashMap**。
   *
   * 职责边界：
   *   - 这里只负责把磁盘上的记录读出来，供 cleanupCache 取模块名去清 Vite deps 缓存；
   *   - 需要把记录灌回解析状态时，由调用方**显式**调用 restoreMetadata()。
   * 为什么必须拆成两个动作：回灌会让 resolve() 命中缓存而跳过 hooks，hooks 里的副作用
   * （setExternals 往 globalObject 登记全局名）随之丢失，output.globals 拿到 undefined，
   * rolldown 直接报 "globals option: The function returned undefined"。
   * Reads the record without touching stashMap. "Read" and "restore state" must stay
   * separate: restoring makes resolve() short-circuit on cache hits, which skips the hooks
   * and drops their side effects (registering global names into globalObject), leaving
   * output.globals to return undefined.
   */
  loadMetadata(): Record<string, ExternalIIFE | ExternalES> {
    try {
      const { metadataPath } = this;
      logger.debug(`Loading metadata from: '${metadataPath}'.`);

      const raw = JSON.parse(readFileSync(metadataPath, 'utf-8')) as { externalized?: unknown } | null;
      return (raw?.externalized || {}) as Record<string, ExternalIIFE | ExternalES>;
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
   * 把 metadata 里的条目灌回 stashMap。
   *
   * 只在一个时机需要：dev 下修改 vite.config 触发 server restart —— vite 会重建插件实例
   * （stashMap 为空），但 DepsOptimizer 不会重新预构建，之前 stash 过的 ES external 信息
   * （format / cdnUrl）就丢了，transformIndexHtml 因此注入不出 modulepreload。
   *
   * 只由 v8 的 closeServer（reason === 'restart'）调用，build 阶段绝不触发；
   * 这样"缓存短路跳过 hooks"的副作用问题不会波及 output.globals。
   *
   * 两条校验：条目形状合法（isExternalInfo）、stash 文件仍然存在。
   * Hydrates stashMap, needed only when a dev restart recreates the plugin while
   * DepsOptimizer does not re-bundle. Called from closeServer(restart) only, never during
   * build, so the cache short-circuit can never affect output.globals.
   */
  restoreMetadata() {
    const stored: Record<string, unknown> = this.loadMetadata();
    if (isPlainObject<Record<string, unknown>>(stored)) {
      for (const [moduleId, entry] of Object.entries(stored)) {
        // stash 文件已被清掉的条目视为失效：丢弃它，让当前配置重新写一份。
        // Entries whose stash file was removed are dropped and re-stashed with current options.
        if (isExternalInfo(entry) && existsSync(entry.stashPath)) {
          this.stashMap.set(moduleId, entry);
        }
      }
    }
  }

  /**
   * 把当前 stashMap 整体写盘。
   *
   * 由预构建插件在自己的 buildEnd 调用，写下的就是"本轮 dev 预构建涉及的 external 名单"，
   * 供下一次 dev 启动时清理 Vite deps 缓存。不再使用防抖：写入时机由生命周期决定，
   * 而不是靠一个时间窗口去猜。
   * Writes the whole stashMap, called from the pre-bundle plugin's buildEnd. No debounce:
   * the timing is defined by the lifecycle, not guessed with a timer.
   */
  flushMetadata(): Promise<void> {
    const { metadataPath } = this;
    logger.debug(`Writing metadata to: '${metadataPath}'.`);
    return outputFile(metadataPath, JSON.stringify({
      externalized: Object.fromEntries(this.stashMap)
    } satisfies ExternalMetadata, null, 2), 'utf-8').catch((err) => {
      // 与 cleanupCache 的写盘策略一致：metadata 只是清理线索，
      // 写失败（只读文件系统等）不影响主流程，也不能炸掉进程，但要留日志可查。
      logger.warn('Failed to write metadata:', err);
    });
  }

  /**
   * stash() 的记忆化版本：如果一个库已经写过磁盘，直接返回缓存的 info。
   * 三个入口共享同一个 Resolver 实例，保证每个库永远只写一次磁盘。
   */
  async stash(libName: string, globalName: string): Promise<ExternalIIFE | ExternalES> {
    const { stashMap } = this;
    const cached = stashMap.get(libName);
    if (cached) {
      logger.trace(`'${libName}' has already been stashed, skipping.`);
      return cached;
    }

    const info = await stashToDisk(libName, globalName, this.cacheDir);
    this.stashMap.set(libName, info);
    return info;
  }

  /**
   * 主判断入口，三个插件入口都调用它。
   *
   * 算法：
   *   1. 先查 stashMap 缓存，命中直接返回。
   *   2. 按插入顺序轮询 resolveHooks：
   *        - 返回 true  → external 且无全局名，调用方自行标 external:true
   *        - 返回字符串 → 写/查 stash 文件，返回带类型 info 对象
   *        - 返回 falsy → 继续下一个 hook
   *   3. 全部不命中 → false，不是 external。
   */
  async resolve(
    source: string,
    importer: string | undefined,
    isResolved: boolean | ResolveIdExtraOptions | Rolldown.ResolveIdExtraOptions,
  ): Promise<ExternalIIFE | ExternalES | boolean> {
    const cached = this.stashMap.get(source);
    if (cached) {
      return cached;
    }

    for (const resolveHook of this.resolveHooks) {
      const globalName = resolveHook(source, importer, isResolved);

      if (globalName === true) {
        return true;
      }

      if (typeof globalName === 'string') {
        return this.stash(source, globalName);
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
