import { join } from 'node:path';

import { outputFile } from 'fs-extra';
import { isAbsoluteURL } from 'is-what-type';
import { flattenId } from 'vp-runtime-helper';

import type { ExternalES, ExternalIIFE } from '../internal-types';
import type { ExternalFn } from '../types';
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
 * 无状态的 stash 写入辅助函数。单独导出是为了方便单测，
 * 以及极端场景下在 Resolver 实例化之前需要手动预热缓存目录。
 *
 * 执行步骤：
 *   1. 把 libName 转成 stash 文件绝对路径（makeStashFilePath）。
 *   2. 判断 globalName 是否为绝对 URL：是 → ES CDN 重导出；否 → IIFE CJS shim 指向 window 全局变量。
 *   3. 用 outputFile 把生成的 JS 代码写盘（自动创建父目录，幂等覆盖）。
 *   4. 返回带类型的 info 对象（ExternalIIFE 或 ExternalES），内含 stashPath、
 *      format 标记、以及原始 globalName/cdnUrl，后续被 Rolldown output.globals 和
 *      transformIndexHtml 消费。
 */
export async function stashToDisk(
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
      moduleId: libName,
      stashPath: libPath,
      cdnUrl: globalName,
      format: 'es'
    } as ExternalES;
    code = makeEsExternalCode(globalName);
  }
  else {
    info = {
      moduleId: libName,
      stashPath: libPath,
      globalName,
      format: 'iife'
    } as ExternalIIFE;
    code = makeCjsExternalCode(globalName);
  }

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
 */
export class Resolver {
  readonly stashMap = new Map<string, ExternalIIFE | ExternalES>();
  private readonly resolveHooks: ExternalFn[] = [];

  constructor(
    private readonly cacheDir: string,
  ) {}

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
   * 注册一个新的 external 判断 hook，追加到列表末尾（后注册后匹配）。
   */
  useHook(hook: ExternalFn): this {
    this.resolveHooks.push(hook);
    return this;
  }
}
