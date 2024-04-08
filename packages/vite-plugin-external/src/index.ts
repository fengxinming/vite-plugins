import { join, isAbsolute } from 'node:path';
import { readFileSync, writeFileSync } from 'node:fs';
import { builtinModules } from 'node:module';
import { types } from 'node:util';
import { emptyDirSync, outputFile } from 'fs-extra';
import { RollupOptions, OutputOptions } from 'rollup';
import { UserConfig, ResolvedConfig, ConfigEnv, Alias, Plugin } from 'vite';

export interface BasicOptions {
  /**
   * The current working directory in which to join `cacheDir`.
   *
   * 用于拼接 `cacheDir` 的路径。
   *
   * @default `process.cwd()`
   */
  cwd?: string;

  /**
   * Cache folder
   *
   * 缓存文件夹
   *
   * @default `${cwd}/node_modules/.vite_external`
   */
  cacheDir?: string;

  /**
   * External dependencies
   *
   * 配置外部依赖
   */
  externals?: Record<string, any>;
}

export interface Options extends BasicOptions {
  /**
   * External dependencies for specific mode
   *
   * 针对指定的模式配置外部依赖
   */
  [mode: string]: BasicOptions | any;

  /**
   * Different `externals` can be specified in different modes.
   *
   * 在不同的模式下，可以指定不同的外部依赖。
   */
  mode?: string;

  /**
   * Controls how Rollup handles default.
   *
   * 用于控制读取外部依赖的默认值。
   */
  interop?: 'auto';

  /**
   * The value of enforce can be either `"pre"` or `"post"`, see more at https://vitejs.dev/guide/api-plugin.html#plugin-ordering.
   *
   * 强制执行顺序，`pre` 前，`post` 后，参考 https://cn.vitejs.dev/guide/api-plugin.html#plugin-ordering。
   */
  enforce?: 'pre' | 'post';

  /**
   * Whether to exclude nodejs built-in modules in the bundle
   *
   * 是否排除 nodejs 内置模块。
   */
  nodeBuiltins?: boolean;

  /**
   * Specify dependencies to not be included in the bundle
   *
   * 排除不需要打包的依赖。
   */
  externalizeDeps?: Array<string | RegExp>;
}

function setExternals(rollupOptions: RollupOptions, externalLibs: any[]) {
  if (externalLibs.length === 0) {
    return;
  }

  const { external } = rollupOptions;

  // if external indicates
  if (!external) {
    rollupOptions.external = externalLibs;
  }
  // string or RegExp or array
  else if (typeof external === 'string' || types.isRegExp(external) || Array.isArray(external)) {
    rollupOptions.external = externalLibs.concat(external);
  }
  // function
  else if (typeof external === 'function') {
    rollupOptions.external = function (source: string, importer: string | undefined, isResolved: boolean):
    boolean | null | undefined | void {
      if (externalLibs.some((libName) => (types.isRegExp(libName) ? libName.test(source) : libName === source))) {
        return true;
      }
      return external(source, importer, isResolved);
    };
  }
}

function rollupOutputGlobals(output: OutputOptions, externals: Record<string, any>): void {
  let { globals } = output;
  if (!globals) {
    globals = {};
    output.globals = globals;
  }
  Object.assign(globals, externals);
}

function setOutputGlobals(rollupOptions: RollupOptions, externals?: Record<string, any>): void {
  if (!externals) {
    return;
  }

  let { output } = rollupOptions;
  if (!output) {
    output = {};
    rollupOptions.output = output;
  }

  // compat Array
  if (Array.isArray(output)) {
    output.forEach((n) => {
      rollupOutputGlobals(n, externals);
    });
  }
  else {
    rollupOutputGlobals(output, externals);
  }
}

/** compat cjs and esm */
function createFakeLib(globalName: string, libPath: string): Promise<void> {
  const cjs = `module.exports = ${globalName};`;
  return outputFile(libPath, cjs, 'utf-8');
}

async function addAliases(
  config: UserConfig,
  cacheDir: string,
  externals: Record<string, any> | undefined,
  libNames: string[]
): Promise<void> {
  // cleanup cache dir
  emptyDirSync(cacheDir);

  if (libNames.length === 0 || !externals) {
    return;
  }

  let { resolve } = config;
  if (!resolve) {
    resolve = {};
    config.resolve = resolve;
  }
  let { alias } = resolve;
  if (!alias) {
    alias = [];
    resolve.alias = alias;
  }

  // #1 if alias is object type
  if (!Array.isArray(alias)) {
    alias = Object.entries(alias).map(([key, value]) => {
      return { find: key, replacement: value };
    });
    resolve.alias = alias;
  }

  await Promise.all(libNames.map((libName) => {
    const libPath = join(cacheDir, `${libName.replace(/\//g, '_')}.js`);
    (alias as Alias[]).push({
      find: new RegExp(`^${libName}$`),
      replacement: libPath
    });
    return createFakeLib(externals[libName], libPath);
  }));
}

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
  let libNames: any[];

  return {
    name: 'vite-plugin-external',
    enforce: opts.enforce,
    async config(config: UserConfig, { mode, command }: ConfigEnv) {
      const {
        cacheDir,
        externals,
        interop
      }  = buildOptions(opts, mode);

      libNames = !externals ? [] : Object.keys(externals);
      let externalLibs = libNames;
      let globals = externals;

      // if development mode
      if (command === 'serve' || interop === 'auto') {
        await addAliases(
          config,
          cacheDir as string,
          globals,
          libNames,
        );
        externalLibs = [];
        globals = void 0;
      }

      if (command === 'build') {
        if (opts.nodeBuiltins) {
          externalLibs = externalLibs.concat(
            builtinModules.map((builtinModule) => {
              return new RegExp(`^(?:node:)?${builtinModule}(?:/.+)*$`);
            })
          );
        }

        const { externalizeDeps } = opts;
        if (externalizeDeps) {
          externalLibs = externalLibs.concat(externalizeDeps.map((dep) => {
            return types.isRegExp(dep) ? dep : new RegExp(`^${dep}(?:/.+)*$`);
          }));
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

      setExternals(rollupOptions, externalLibs);
      setOutputGlobals(rollupOptions, globals);
    },
    configResolved(config: ResolvedConfig) {
      // cleanup cache
      if (config.command === 'serve') {
        const depCache = join(config.cacheDir, 'deps', '_metadata.json');
        let metadata;
        try {
          metadata = JSON.parse(readFileSync(depCache, 'utf-8'));
        }
        catch (e) {}

        if (metadata && libNames && libNames.length) {
          const { optimized } = metadata;
          if (optimized && Object.keys(optimized).length) {
            libNames.forEach((libName) => {
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
