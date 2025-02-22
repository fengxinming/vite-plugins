import { join, isAbsolute } from 'node:path';
import { readFileSync, writeFileSync } from 'node:fs';
import { builtinModules } from 'node:module';
import { types } from 'node:util';
import { UserConfig, ResolvedConfig, ConfigEnv, Plugin } from 'vite';
import { Options } from './typings';
import { setOutputGlobals } from './handleGlobals';
import { setExternals } from './handleExternals';
import { setAliases } from './handleAliases';

export * from './typings';
function buildOptions(opts: Options, mode: string): Options {
  let {
    cwd,
    cacheDir,
    externals,
    // eslint-disable-next-line prefer-const
    ...rest
  } = opts || {};
  const modeOptions: Options | undefined = opts[mode];

  if (modeOptions) {
    Object.entries(modeOptions).forEach(([key, value]) => {
      if (value) {
        switch (key) {
          case 'cwd':
            cwd = value;
            break;
          case 'cacheDir':
            cacheDir = value;
            break;
          case 'externals':
            externals = Object.assign({}, externals, value);
            break;
        }
      }
    });
  }

  if (!cwd) {
    cwd = process.cwd();
  }
  if (!cacheDir) {
    cacheDir = join(cwd, 'node_modules', '.vite_external');
  }
  else if (!isAbsolute(cacheDir)) {
    cacheDir = join(cwd, cacheDir);
  }

  return {
    ...rest,
    cwd,
    cacheDir,
    externals
  };
}

/**
 * provides a way of excluding dependencies from the runtime code and output bundles.
 *
 * @example
 * ```js
 * import createExternal from 'vite-plugin-external';
 *
 * export default defineConfig({
 *  plugins: [
 *    createExternal({
 *      externals: {
 *        react: 'React'
 *      }
 *    })
 *  ],
 *  build: {
 *    cssCodeSplit: false,
 *    rollupOptions: {
 *      output: {
 *        manualChunks: undefined,
 *        assetFileNames: 'assets/[name][extname]',
 *        entryFileNames: '[name].js',
 *        format: 'iife'
 *      }
 *    }
 *  }
 * });
 * ```
 *
 * @param opts options
 * @returns a vite plugin
 */
export default function createPlugin(opts: Options): Plugin {
  let externalNames: any[];
  let globals: Record<string, string> | undefined;

  return {
    name: 'vite-plugin-external',
    enforce: opts.enforce,
    async config(config: UserConfig, { mode, command }: ConfigEnv) {
      opts = buildOptions(opts, mode);

      globals = opts.externals;
      externalNames = globals ? Object.keys(globals) : [];
      if (externalNames.length === 0) {
        globals = void 0;
      }

      const cacheDir = opts.cacheDir as string;

      // if development mode
      if (command === 'serve' || opts.interop === 'auto') {
        await setAliases(config, cacheDir, globals);
        return;
      }

      // externalize dependencies for build command
      if (command === 'build') {
        const { nodeBuiltins, externalizeDeps } = opts;

        // handle nodejs built-in modules
        if (nodeBuiltins) {
          externalNames = externalNames.concat(
            builtinModules.map((builtinModule) => {
              return new RegExp(`^(?:node:)?${builtinModule}(?:/.+)*$`);
            })
          );
        }

        // externalize given dependencies
        if (externalizeDeps) {
          externalNames = externalNames.concat(
            externalizeDeps.map((dep) => {
              return types.isRegExp(dep) ? dep : new RegExp(`^${dep}(?:/.+)*$`);
            })
          );
        }
      }

      let { build } = config;
      if (!build) {
        build = {};
        config.build = build;
      }
      let { rollupOptions } = build;
      if (!rollupOptions) {
        rollupOptions = {};
        build.rollupOptions = rollupOptions;
      }

      setExternals(rollupOptions, externalNames);
      setOutputGlobals(rollupOptions, globals, opts.externalGlobals);
    },
    configResolved(config: ResolvedConfig) {
      // cleanup cache
      if (config.command === 'serve') {
        const depCache = join(config.cacheDir, 'deps', '_metadata.json');

        let metadata;
        try {
          metadata = JSON.parse(readFileSync(depCache, 'utf-8'));
        }
        catch (e) {
          return;
        }

        if (metadata && externalNames && externalNames.length) {
          const { optimized } = metadata;
          if (optimized && Object.keys(optimized).length) {
            externalNames.forEach((libName) => {
              if (optimized[libName]) {
                delete optimized[libName];
              }
            });
          }

          writeFileSync(depCache, JSON.stringify(metadata));
        }
      }
    }
  };
}
