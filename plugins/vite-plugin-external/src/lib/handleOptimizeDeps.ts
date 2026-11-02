import type { Rolldown, UserConfig } from 'vite';
import { isCSSRequest } from 'vite';
import { getValue } from 'vp-runtime-helper';

import {
  DEP_PRE_BUNDLE_CONVERSION_PREFIX,
  DEP_PRE_BUNDLE_EXTERNAL_PREFIX,
  ROLLDOWN_PLUGIN_NAME
} from '../common/constants';
import { logger } from '../common/logger';
import { Resolver } from '../common/Resolver';
import type { ResolvedOptions } from '../internal-types';

/**
 * 通过 optimizeDeps.rolldownOptions.plugins 注入到 Vite 8 DepsOptimizer
 * 预打包流程的 Rolldown 插件，取代 vite-plugin-external 老版本里的 esbuild 插件。
 *
 * 为什么需要这个插件？
 * DepsOptimizer 会预打包 optimizeDeps.include 列表 + 运行时动态发现的
 * missing import。当用户声明了 externals: {react:'React'} 后，预打包器仍然
 * 需要知道：
 *   - import 'react' 需要 bundle 吗？→ 不需要（external） 或 需要（打包 stash shim）
 *   - 如果 bundle，读哪个源代码？ → 读本插件写的 stash 文件
 * 没有这个插件，Rolldown 会试图去 node_modules 找 react，用户没装就直接报错。
 *
 * 生命周期流程：
 *   1. resolveId(id, importer, {isEntry}) —— 通过共享的 Resolver 询问 id
 *      是否是 external。三种可能结果：
 *
 *        (a) id 命中 DEP_PRE_BUNDLE_EXTERNAL_PREFIX 前缀 →
 *            return { id: <剥离前缀>, external: true }。
 *            这是 load 阶段生成 '<prefix>react' 之后进入第二轮 resolveId。
 *            剥离前缀，直接 external:true 放行。
 *
 *        (b) Resolver.resolve() 返回 true → 纯 external，没有 stash 文件。
 *            不能简单 return {external:true}，因为 CSS import 和
 *            import * as X from 'X' 在预打包后会丢失命名空间形状导致出错。
 *            所以把 id 加上 DEP_PRE_BUNDLE_CONVERSION_PREFIX 前缀重定向到一个
 *            虚拟模块，让下一轮 load 生成重导出 shim，shim 内部 import '<prefix>id'，
 *            再回到 (a) 分支把 '<prefix>id' 剥离前缀后标 external:true。
 *            等价于"预打包后的模块里保留了 import 'external' 的原样"，
 *            但把 CJS/ESM 命名空间形状正确传递过去。
 *
 *            为什么用 id 前缀而不是 resolveId 的 namespace 字段：
 *            rolldown 的 load 钩子只传 id（实测 argc=1，moduleInfo.meta 为空），
 *            namespace 无法抵达 load；vite 自身也是把命名空间编进 id 前缀
 *            （内部 idToPathAndNamespace 按第一个冒号切分）。
 *
 *        (c) Resolver.resolve() 返回 stash info（IIFE / ES 格式）→
 *            直接把预打包器重定向到 stash 文件路径 info.stashPath。
 *            这里不标 external:true，因为 stash 文件本身是真实 JS 文件，
 *            Rolldown 会正常打包它。
 *
 *   2. load(id) —— 只有 id 带 DEP_PRE_BUNDLE_CONVERSION_PREFIX 前缀时才触发
 *      （对应上面 case b）。生成小型 ESM 重导出 shim，通过 '<prefix>id'
 *      把所有导出转发出去，再经由 (a) 分支正确 external。
 *      CSS 请求简化成裸 import。
 *
 *   3. buildEnd() —— 输出已写 stash 的库名（便于排查"为什么 X 还在打包"），
 *      并把本轮 external 名单落盘，供下一次 dev 启动清理 Vite deps 缓存。
 */
function rolldownPluginForExternals(
  resolver: Resolver,
): Rolldown.Plugin {
  return {
    name: ROLLDOWN_PLUGIN_NAME,
    async resolveId(id: string, importer: string | undefined, extra: Rolldown.ResolveIdExtraOptions) {
      // case (a) — 前缀 specifier 的第二轮 resolve。
      if (id.startsWith(DEP_PRE_BUNDLE_EXTERNAL_PREFIX)) {
        return {
          id: id.slice(DEP_PRE_BUNDLE_EXTERNAL_PREFIX.length),
          external: true
        };
      }

      const info = await resolver.resolve(id, importer, extra);

      // 不是 external → 让 Rolldown 按常规流程解析。
      if (!info) {
        return null;
      }

      // case (b) — 纯 external。把 id 加上转换前缀重定向到虚拟模块，
      // 让 load 能识别并生成保留命名空间形状的重导出 shim。
      if (info === true) {
        logger.debug(`[${ROLLDOWN_PLUGIN_NAME}] Pre-bundling: '${id}' will be externalized (pure external).`);
        return {
          id: DEP_PRE_BUNDLE_CONVERSION_PREFIX + id
        };
      }

      // case (c) — 基于 stash 的命名 external / CDN external。记录日志分类，
      // 然后把解析目标重定向到 stash 路径。
      if (info.format === 'iife') {
        logger.debug(`[${ROLLDOWN_PLUGIN_NAME}] Pre-bundling IIFE external:`, {
          globalName: info.globalName,
          moduleId: info.moduleId,
          importer,
          extra
        });
      }
      else {
        logger.debug(`[${ROLLDOWN_PLUGIN_NAME}] Pre-bundling ES external:`, {
          cdnUrl: info.cdnUrl,
          moduleId: info.moduleId,
          importer,
          extra
        });
      }

      return {
        id: info.stashPath
      };
    },

    // case (b) 的配对处理：生成 ESM 重导出 shim。
    // load 只收 id，所以用前缀判定"这是我的转入模块"，再剥离出原始 id。
    load(id: string) {
      if (!id.startsWith(DEP_PRE_BUNDLE_CONVERSION_PREFIX)) {
        return null;
      }

      const originalId = id.slice(DEP_PRE_BUNDLE_CONVERSION_PREFIX.length);
      const modulePath = `"${DEP_PRE_BUNDLE_EXTERNAL_PREFIX}${originalId}"`;

      return {
        code: isCSSRequest(originalId)
          ? `import ${modulePath};`
          : `export { default } from ${modulePath};\nexport * from ${modulePath};`,
        moduleType: 'js'
      };
    },

    /*
     * buildEnd — 预构建结束时把本轮 external 名单落盘
     * buildEnd — Persists this round's external list when pre-bundling ends
     *
     * 为什么在这里写：这是 dev 预构建唯一的结束点，此时"本轮涉及哪些 external"已经确定；
     * 写下的名单供下一次 dev 启动清理 Vite deps 缓存（见 v8 的 configResolved）。
     * Why here: the only end-of-round point for dev pre-bundling. The written list is what
     * the next dev start uses to clear stale Vite deps entries.
     */
    buildEnd() {
      logger.debug(`[${ROLLDOWN_PLUGIN_NAME}] Pre-bundling externals:`, Array.from(resolver.stashMap.keys()));
      return resolver.flushMetadata();
    }
  };
}

/**
 * 把上面的 Rolldown 插件挂到 optimizeDeps.rolldownOptions.plugins。
 * 如果用户已有配置，我们 append 在末尾——基于共享状态的 Resolver 判断
 * 优先于通用 resolve 插件，但用户显式加的自定义 Rolldown 插件先跑是合理的。
 */
export async function setOptimizeDeps(
  resolver: Resolver,
  _opts: ResolvedOptions,
  config: UserConfig,
): Promise<void> {
  const plugins = getValue<Rolldown.Plugin[]>(
    config,
    'optimizeDeps.rolldownOptions.plugins',
    [],
  );
  const lastIndex = plugins.findIndex((n) => n.name === ROLLDOWN_PLUGIN_NAME);
  if (lastIndex !== -1) {
    plugins.splice(lastIndex, 1);
  }
  plugins.push(rolldownPluginForExternals(resolver));
}
