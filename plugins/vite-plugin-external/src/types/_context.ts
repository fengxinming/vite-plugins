import type { ViteDevServer } from 'vite';

import type { Resolver } from '../common/Resolver';
import type { ExternalFn } from './deps';
import type { ResolvedOptions } from './options';

/**
 * config 钩子构建、供后续钩子消费的 external 判定链产出。
 *
 * externalFn 负责判定（同时把字符串命中登记进 globalObject）；
 * globalObject 由 outputOptions 钩子逐个 output 包成 output.globals 查表函数。
 * 两者都不就地写入用户 config：external 走 config 返回值，globals 走 outputOptions。
 */
export interface ExternalsSetup {
  externalFn: ExternalFn;
  globalObject: Record<string, string>;
}

export interface PluginContext {
  options: ResolvedOptions;
  resolver: Resolver;
  devServer: ViteDevServer;
  externalsSetup: ExternalsSetup;
  /**
   * client 环境的依赖预构建器，经 getter 读取。
   *
   * getter 会在 devServer 尚未赋值时告警并返回 undefined —— 访问时 devServer
   * 正常应已由 configureServer 钩子注入，若为空说明调用时机早于预期，需留日志。
   */
  // Vite 未导出 DepsOptimizer 具名类型（仅内部声明），故从 client 环境推导。
  readonly depsOptimizer: NonNullable<ViteDevServer['environments']['client']>['depsOptimizer'];
}
