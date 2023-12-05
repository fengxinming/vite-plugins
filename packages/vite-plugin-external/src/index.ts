import { types } from 'node:util';
import { emptyDirSync, outputFile } from 'fs-extra';
import { join } from 'node:path';
import { RollupOptions, OutputOptions } from 'rollup';
import { UserConfig, ConfigEnv, Alias, Plugin } from 'vite';

export interface BasicOptions {
  cwd?: string;
  cacheDir?: string;
  externals: Externals;
}

export interface Externals {
  [packageName: string]: any;
}

export interface Options extends BasicOptions {
  [mode: string]: BasicOptions | any;

  development?: BasicOptions;
  production?: BasicOptions;

  devMode?: string;
  enforce?: 'pre' | 'post';
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

function rollupOutputGlobals(output: OutputOptions, externals: Externals): void {
  let { globals } = output;
  if (!globals) {
    globals = {};
    output.globals = globals;
  }
  Object.assign(globals, externals);
}

function rollupExternal(rollupOptions: RollupOptions, externals: Externals, libNames: any[]): void {
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

// compat cjs and esm
function createFakeLib(globalName: string, libPath: string): Promise<void> {
  const cjs = `module.exports = ${globalName};`;
  return outputFile(libPath, cjs, 'utf-8');
}

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
        cacheDir = join(cwd, 'node_modules', '.vite', 'vite:external');
      }

      const libNames: string[] = !externals ? [] : Object.keys(externals);
      const shouldSkip = !libNames.length;

      if (shouldSkip) {
        return;
      }

      const devMode = opts.devMode || 'development';

      // non development
      if (mode !== devMode) {
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

      await Promise.all(libNames.map((libName) => {
        const libPath = join(cacheDir as string, `${libName.replace(/\//g, '_')}.js`);
        (alias as Alias[]).push({
          find: new RegExp(`^${libName}$`),
          replacement: libPath
        });
        return createFakeLib(externals[libName], libPath);
      }));
    }
  };
}
