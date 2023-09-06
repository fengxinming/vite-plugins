import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { emptyDirSync } from 'fs-extra';
import { join } from 'node:path';
import { RollupOptions, OutputOptions } from 'rollup';
import { UserConfig, ConfigEnv, Alias, Plugin } from 'vite';

export interface BasicOptions {
  externals: Externals;
}

export interface Externals {
  [packageName: string]: any;
}

export interface Options extends BasicOptions {
  [mode: string]: Options | any;

  cwd?: string;
  development?: Options;
  production?: Options;
  cacheDir?: string;
  externals: Externals;
}

// compat cjs and esm
function createCJSExportDeclaration(external: string) {
  return `module.exports = ${external};`;
}

function rollupOutputGlobals(output: OutputOptions, externals: Externals): void {
  let { globals } = output;
  if (!globals) {
    globals = {};
    output.globals = globals;
  }
  Object.assign(globals, externals);
}

function rollupExternal(rollupOptions: RollupOptions, externals: Externals, externalKeys: string[]): void {
  let { output, external } = rollupOptions;
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

  // if external indicates
  if (!external) {
    external = [];
    rollupOptions.external = external;
  }
  (external as string[]).push(...externalKeys);
}

export default function createPlugin(opts: Options): Plugin {
  const cwd = opts.cwd || process.cwd();
  const externalCacheDir = opts.cacheDir || join(cwd, 'node_modules', '.vite_external');

  let externals: Externals = {};
  let externalKeys: string[] = [];
  let shouldSkip = false;

  return {
    name: 'vite:external',

    config(config: UserConfig, { mode }: ConfigEnv) {
      const modeOptions: Options | undefined = opts[mode];

      externals = Object.assign({}, opts.externals, modeOptions && modeOptions.externals);
      externalKeys = Object.keys(externals);
      shouldSkip = !externalKeys.length;

      if (shouldSkip) {
        return;
      }

      // non development
      if (mode !== 'development') {
        let { build } = config;

        // if no build indicates
        if (!build) {
          build = {};
          config.build = build;
        }

        let { rollupOptions } = build;

        // if no rollupOptions indicates
        if (!rollupOptions) {
          rollupOptions = {};
          build.rollupOptions = rollupOptions;
        }

        rollupExternal(rollupOptions, externals, externalKeys);
        return;
      }

      if (!existsSync) {
        mkdirSync(externalCacheDir);
      }
      else {
        emptyDirSync(externalCacheDir);
      }

      let { resolve } = config;
      if (!resolve) {
        resolve = {};
        config.resolve = resolve;
      }

      let { alias } = resolve;
      if (!alias || typeof alias !== 'object') {
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

      for (const libName of externalKeys) {
        const libPath = join(externalCacheDir, `${libName.replace(/\//g, '_')}.js`);
        writeFileSync(libPath, createCJSExportDeclaration(externals[libName]));

        (alias as Alias[]).push({
          find: new RegExp(`^${libName}$`),
          replacement: libPath
        });
      }
    }
  };
}
