import { join, isAbsolute } from 'node:path';
import { types } from 'node:util';
import { emptyDirSync, outputFile } from 'fs-extra';
import { RollupOptions, OutputOptions } from 'rollup';
import { UserConfig, ConfigEnv, Alias, Plugin } from 'vite';

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
   * 外部依赖
   */
  externals: Record<string, any>;
}

export interface Options extends BasicOptions {
  /**
   * External dependencies for specific modes
   *
   * 针对指定的模式配置外部依赖
   */
  [mode: string]: BasicOptions | any;

  /**
   * The mode to use when resolving `externals`.
   *
   * 当配置的 `mode` 和执行 `vite` 命令时传入的 `--mode` 参数匹配时，将采用了别名加缓存的方式处理 `externals`。
   * 设置为 `false` 时，可以有效解决外部依赖对象在 `default` 属性。
   *
   * @default 'development'
   */
  mode?: string | false;

  /**
   * The value of enforce can be either `"pre"` or `"post"`, see more at https://vitejs.dev/guide/api-plugin.html#plugin-ordering.
   *
   * 强制执行顺序，`pre` 前，`post` 后，参考 https://cn.vitejs.dev/guide/api-plugin.html#plugin-ordering
   */
  enforce?: 'pre' | 'post';

  /**
   * External dependencies format
   *
   * 外部依赖以什么格式封装
   *
   * @default 'cjs'
   */
  format?: 'cjs' | 'es';
}

function get(obj: {[key: string]: any}, key: string): any {
  if (obj == null) {
    return {};
  }
  key.split('.').forEach((name) => {
    let val = obj[name];
    if (val == null) {
      val = {};
      obj[name] = val;
    }
    obj = val;
  });

  return obj;
}

function rollupOutputGlobals(output: OutputOptions, externals: Record<string, any>): void {
  let { globals } = output;
  if (!globals) {
    globals = {};
    output.globals = globals;
  }
  Object.assign(globals, externals);
}

function rollupExternal(rollupOptions: RollupOptions, externals: Record<string, any>, libNames: any[]): void {
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

  const { external } = rollupOptions;

  // if external indicates
  if (!external) {
    rollupOptions.external = libNames;
  }
  // string or RegExp or array
  else if (typeof external === 'string' || types.isRegExp(external) || Array.isArray(external)) {
    rollupOptions.external = libNames.concat(external);
  }
  // function
  else if (typeof external === 'function') {
    rollupOptions.external = function (source: string, importer: string | undefined, isResolved: boolean):
    boolean | null | undefined | void {
      if (libNames.includes(source)) {
        return true;
      }
      return external(source, importer, isResolved);
    };
  }
}

/** compat cjs and esm */
function createFakeLib(globalName: string, libPath: string, format?: 'cjs' | 'es'): Promise<void> {
  const cjs = format === 'es' ? `export default ${globalName};` : `module.exports = ${globalName};`;
  return outputFile(libPath, cjs, 'utf-8');
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
  return {
    name: 'vite:external',
    enforce: opts.enforce,
    async config(config: UserConfig, { mode }: ConfigEnv) {
      let { cwd, cacheDir, externals } = opts;
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

      const libNames: string[] = !externals ? [] : Object.keys(externals);
      const shouldSkip = !libNames.length;

      if (shouldSkip) {
        return;
      }

      const devMode = opts.mode ?? opts.devMode ?? 'development';

      // non development
      if (devMode !== false && devMode !== mode) {
        // configure rollup
        rollupExternal(
          get(config, 'build.rollupOptions'),
          externals,
          libNames
        );
        return;
      }

      // cleanup cache dir
      emptyDirSync(cacheDir);

      let alias = get(config, 'resolve.alias');

      // #1 if alias is object type
      if (!Array.isArray(alias)) {
        alias = Object.entries(alias).map(([key, value]) => {
          return { find: key, replacement: value };
        });
        config.resolve!.alias = alias;
      }

      const { format } = opts;
      await Promise.all(libNames.map((libName) => {
        const libPath = join(cacheDir as string, `${libName.replace(/\//g, '_')}.js`);
        (alias as Alias[]).push({
          find: new RegExp(`^${libName}$`),
          replacement: libPath
        });
        return createFakeLib(externals[libName], libPath, format);
      }));
    }
  };
}
