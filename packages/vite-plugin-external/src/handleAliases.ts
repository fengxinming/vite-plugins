import { emptyDirSync, outputFile } from 'fs-extra';
import { join } from 'node:path';
import { UserConfig, Alias } from 'vite';

/** compat cjs and esm */
function createFakeLib(globalName: string, libPath: string): Promise<void> {
  const cjs = `module.exports = ${globalName};`;
  return outputFile(libPath, cjs, 'utf-8');
}

export async function setAliases(
  config: UserConfig,
  cacheDir: string,
  globals: Record<string, any> | undefined
): Promise<void> {
  // cleanup cache dir
  emptyDirSync(cacheDir);

  if (!globals) {
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

  await Promise.all(
    Object.entries(globals).map(([libName, globalName]) => {
      const libPath = join(cacheDir, `${libName.replace(/\//g, '_')}.js`);
      (alias as Alias[]).push({
        find: new RegExp(`^${libName}$`),
        replacement: libPath
      });

      return createFakeLib(globalName, libPath);
    })
  );
}
