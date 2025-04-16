import type { ConfigEnv, Plugin, UserConfig } from 'vite';
import { DevEnvironment } from 'vite';

import { PLUGIN_NAME } from './common/constants';
import { logger } from './common/logger';
import { Resolver } from './common/Resolver';
import { setExternals } from './lib/handleExternals';
import { setOptimizeDeps } from './lib/handleOptimizeDeps';
import { buildOptions, isRuntime } from './lib/handleOptions';
import { cleanupCache } from './rollback';
import type { Options, ResolvedOptions } from './typings';

export default function v6(opts: Options): Plugin {
  let resolvedOptions: ResolvedOptions;
  let resolver: Resolver;

  const autoInterop = opts.interop === 'auto';

  return {
    name: PLUGIN_NAME,
    enforce: autoInterop ? 'pre' : opts.enforce,
    async config(config: UserConfig, env: ConfigEnv) {
      resolvedOptions = buildOptions(opts, env);
      resolver = new Resolver(resolvedOptions.cacheDir);

      await setOptimizeDeps(resolver, resolvedOptions, config);
      resolver.useHook(setExternals(resolvedOptions, config));

      if (autoInterop) {
        config.build!.rollupOptions!.external = undefined;
      }
    },

    configResolved(config) {
      if (!isRuntime(resolvedOptions)) {
        logger.debug('Resolved rollupOptions:', config.build.rollupOptions);
      }

      // cleanup cache metadata
      cleanupCache(resolvedOptions.externals, config);
    },

    async resolveId(id, importer, { isEntry }) {
      const info = await resolver.resolve(id, importer, isEntry);

      if (!info) {
        logger.trace(`'${id}' is not external.`);
        return;
      }

      if (info === true) {
        logger.debug(`'${id}' is marked as external.`);
        return { id, external: true };
      }

      const { resolvedId } = info;
      const { mode } = this.environment;

      if (mode === 'build') {
        logger.debug(`'${id}' is resolved to '${resolvedId}'.`);
        return resolvedId;
      }

      const depsOptimizer = (this.environment as DevEnvironment).depsOptimizer!;
      const depInfo = depsOptimizer.registerMissingImport(id, resolvedId);
      const depId = depsOptimizer.getOptimizedDepId(depInfo);

      logger.debug(`'${id}' is resolved to ${depId}`);
      return depId;
    }
  };
}

