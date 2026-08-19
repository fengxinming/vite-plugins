import { join } from 'node:path';

import { outputFile } from 'fs-extra';
import { isAbsoluteURL } from 'is-what-type';
import { flattenId } from 'vp-runtime-helper';

import type { ExternalES, ExternalFn, ExternalIIFE } from '../typings';
import { logger } from './logger';

/**
 * Produce the on-disk path for a stash file for a given library name.
 * Uses 'flattenId' so subpaths like 'react-dom/client' become a valid
 * single filename ('react-dom__client.js') rather than nested folders.
 *
 * 把库名（可能含子路径 '/'）转换成 stash 文件的磁盘绝对路径。
 * 使用 'flattenId' 是为了把 'react-dom/client' 这种子路径拍平成单个合法文件名
 * （'react-dom__client.js'），避免在 cacheDir 里生成嵌套目录。
 */
function makeStashFilePath(cacheDir: string, libName: string): string {
  return join(cacheDir, `${flattenId(libName)}.js`);
}

/**
 * Compatibility shim used when a library is mapped to a plain global name
 * (e.g. '{ react: 'React' }').
 *
 * 为什么写 CJS 而不是 ESM（Why CJS, not ESM?）：
 *   历史反复迭代后稳定在 'module.exports = React;' 这种写法。
 *   该形式在 DepsOptimizer 的 Rolldown 预打包阶段（dev）和 Rolldown 构建阶段
 *   （build, CJS output）**都**能被正确识别：
 *     - Dev：DepsOptimizer 会对它做 CJS→ESM 互操作包装，'import React from 'react''
 *       仍然拿到 default。
 *     - Build（走 stash 解析路线）：Rolldown 看到 CJS 'module.exports = X' 就知道
 *       整个模块导出的是 default，与 IIFE 全局变量的形状一致。
 *   如果改成 ESM（'export default React;'）语义就不一样：IIFE build 时 Rolldown
 *   可能把它当成"命名导出"模块，和原来用户期望的 window.React 不一致。
 *
 *   Original code converged on 'module.exports = <globalName>;' after many
 *   iterations. This form is understood by both:
 *     - the DepsOptimizer pre-bundler (Rolldown wraps it with CJS→ESM interop
 *       so 'import X from 'lib'' still yields default), and
 *     - the final build bundler (Rolldown treats the whole stash as the sole
 *       default export, matching the IIFE global shape).
 *   ESM form ('export default X;') would split the meaning and produce
 *   subtly-wrong IIFE bundles in some tested edge cases.
 */
function makeCjsExternalCode(globalName: string): string {
  return `module.exports = ${globalName};`;
}

/**
 * Shim for ESM CDN links. The generated file simply re-exports everything
 * from the absolute URL so downstream consumers see the original module
 * shape (both default and named exports).
 *
 * ESM CDN 链接的 shim：简单地从绝对 URL 重导出 default + 所有命名导出。
 * 下游模块看到的就是 CDN 原始模块的导出形态，不会丢具名导出。
 */
function makeEsExternalCode(link: string): string {
  return `export { default } from '${link}';\nexport * from '${link}';`;
}

/**
 * Stateless stash helper (kept as a separate export for tests and for the
 * rare case where legacy code needs to prime a cache directory before
 * Resolver exists).
 *
 * 无状态 stash 辅助函数：单独导出是为了方便单测、以及极端场景下在 Resolver
 * 构造之前先手动写入缓存目录。
 *
 * 实际做的事（Steps）：
 *   1. Convert libName → stash file absolute path via 'makeStashFilePath'.
 *   2. Inspect 'globalName' for absolute URL → ES format (CDN re-export);
 *      otherwise → IIFE format (CJS shim referencing a window global).
 *   3. Write the resulting JS code to disk with 'outputFile' (auto-creates
 *      parent dirs, idempotent overwrite).
 *   4. Return the typed info object (ExternalIIFE or ExternalES) containing
 *      the stash path, format tag, and the original name/link for later
 *      consumption by Rolldown 'output.globals' / 'transformIndexHtml'.
 *
 *   1. 把 libName 转成 stash 文件绝对路径。
 *   2. 判断 'globalName' 是否为绝对 URL → ES 格式（CDN 重导出）或 IIFE 格式
 *      （CJS shim 指向 window 全局变量）。
 *   3. 写 JS 代码到磁盘（outputFile 自动创建父目录，幂等覆盖）。
 *   4. 返回带类型的 info 对象（ExternalIIFE | ExternalES），内含 stash 路径、
 *      格式标记、以及原始的 name/link，后续被 output.globals 和
 *      transformIndexHtml 引用。
 */
export async function stash(
  libName: string,
  globalName: string,
  cacheDir: string,
): Promise<ExternalIIFE | ExternalES> {
  const libPath = makeStashFilePath(cacheDir, libName);
  logger.trace(`Stashing a file: '${libPath}' for '${globalName}'.`);

  let info: ExternalIIFE | ExternalES;
  let code: string;

  if (isAbsoluteURL(globalName)) {
    info = {
      external: libName,
      resolvedId: libPath,
      link: globalName,
      format: 'es'
    } as ExternalES;
    code = makeEsExternalCode(globalName);
  }
  else {
    info = {
      external: libName,
      resolvedId: libPath,
      name: globalName,
      format: 'iife'
    } as ExternalIIFE;
    code = makeCjsExternalCode(globalName);
  }

  await outputFile(libPath, code, 'utf-8');
  return info;
}

/**
 * Central coordinator for the question "is this import external, and if so
 * where should it resolve?".
 *
 * 设计背景（Design rationale）：
 * 需要共享两份状态：
 *   1. 'stashMap<string, ExternalIIFE | ExternalES>' —— 已写过磁盘的库 → stash info。
 *      避免同一个库在 dev resolveId、build resolveId、pre-bundle resolveId
 *      三处入口重复写文件；更关键的是让 'transformIndexHtml' 知道哪些库是 ES
 *      格式，从而注入 modulepreload。
 *   2. 'resolveHooks: ExternalFn[]' —— 由用户配置编译出来的"判断列表"，通过
 *      'setExternals(...)' 返回 hook 后调用 'resolver.useHook(hook)' 注入。
 *
 * Two state layers are shared across the three plugin entry points
 * (dev resolveId, build resolveId, pre-bundling Rolldown resolve):
 *   1. 'stashMap' — already-written stash entries, so each lib is written
 *      exactly once to disk, and 'transformIndexHtml' can enumerate
 *      ESM-format entries to emit '<link rel="modulepreload">' tags.
 *   2. 'resolveHooks' — the user-declared decision functions compiled by
 *      'setExternals' and plugged in via 'useHook()'.
 *
 * 为什么把"写磁盘"和"resolve 判断"合并到同一个类？
 * 因为这两个操作在三个入口都会被问到，如果各写各的就会：
 *   - 写三份相同的 stash 文件（浪费 IO，虽然可接受）
 *   - transformIndexHtml 拿不到哪些库是 ES 格式的信息
 *   - 三个入口判断结果可能不一致（最严重的 bug 源）
 * 单一 Resolver 持有同一对 map+hook 列表，彻底消除了上述问题。
 *
 * Co-locating disk IO + external decisions in one class eliminates the
 * class of bugs where: (a) the same lib is stashed three times, (b)
 * 'transformIndexHtml' cannot enumerate ES-format externals, or worst of
 * all (c) the three entry points disagree on whether an import is external.
 */
export class Resolver {
  readonly stashMap = new Map<string, ExternalIIFE | ExternalES>();
  private readonly resolveHooks: ExternalFn[] = [];

  constructor(
    private readonly cacheDir: string,
  ) {}

  /**
   * Memoized version of 'stash()'. Once a lib is on disk the same info is
   * returned to all callers.
   *
   * 'stash()' 的记忆化版本：如果一个库已经写过磁盘，直接返回缓存的 info。
   * 三个入口共享同一个 Resolver 实例，因此永远只写一次。
   */
  async stash(libName: string, globalName: string): Promise<ExternalIIFE | ExternalES> {
    const { stashMap } = this;
    const cached = stashMap.get(libName);
    if (cached) {
      logger.trace(`'${libName}' has already been stashed, skipping.`);
      return cached;
    }

    const info = await stash(libName, globalName, this.cacheDir);
    this.stashMap.set(libName, info);
    return info;
  }

  /**
   * Primary decision point — used by every plugin entry point.
   *
   * 算法（Algorithm）：
   *   1. Hit the 'stashMap' cache first.
   *      查 'stashMap' 缓存，命中直接返回。
   *   2. Iterate 'resolveHooks' in insertion order:
   *      按插入顺序轮询 'resolveHooks'：
   *        - returns 'true'   → external without global name → caller marks
   *                             '{ external: true }' on the result
   *                             返回 true：external 且无全局名，调用方直接标 external:true
   *        - returns 'string' → write / lookup stash file, return typed info
   *                             返回字符串：写/查 stash 文件，返回带类型 info
   *        - returns falsy   → keep iterating
   *                             不匹配，继续下一个 hook
   *   3. No hook matched → false, not external.
   *      全部不命中 → false，不是 external。
   */
  async resolve(
    source: string,
    importer: string | undefined,
    isResolved: boolean,
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
   * Register a new external decision hook at the end of the list.
   * 注册一个新的 external 判断 hook，追加到列表末尾（后注册后匹配）。
   */
  useHook(hook: ExternalFn): this {
    this.resolveHooks.push(hook);
    return this;
  }
}
