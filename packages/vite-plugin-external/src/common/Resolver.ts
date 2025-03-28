import { join } from 'node:path';

import { outputFile } from 'fs-extra';

import { ExternalFn } from '../typings';
import { logger } from './logger';
import { flattenId } from './util';

function makeStashFilePath(cacheDir: string, libName: string): string {
  return join(cacheDir, `${flattenId(libName)}.js`);
}

/** compat cjs and esm */
function makeCjsExternalCode(globalName: string): string {
  return `module.exports = ${globalName};`;
}

export async function stash(libName: string, globalName: string, cacheDir: string): Promise<string> {
  const libPath = makeStashFilePath(cacheDir, libName);

  logger.trace(`Stashing a file: "${libPath}" for "${globalName}".`);

  await outputFile(
    libPath,
    makeCjsExternalCode(globalName),
    'utf-8'
  );
  return libPath;
}

export function eachExternal(
  obj: Record<string, string> | Array<[string, string]>,
  cacheDir: string,
  cb: (libName: string, globalName: string) => Promise<string>
): Promise<string[]> {
  if (Array.isArray(obj)) {
    const promises: Array<Promise<string>> = [];

    for (const [libName, globalName] of obj) {
      promises.push(cb(libName, globalName));
    }

    return Promise.all(promises);
  }

  return eachExternal(Object.entries(obj), cacheDir, cb);
}

export class Resolver {
  stashed = false;
  readonly stashMap = new Map<string, string>();
  private resolveHook?: ExternalFn;
  constructor(
    private readonly cacheDir: string
  ) {
  }

  async stash(libName: string, globalName: string): Promise<string> {
    const { stashMap } = this;
    let stashPath = stashMap.get(libName);
    if (stashPath) {
      logger.trace(`"${libName}" has already been stashed, skipping.`);
    }
    else {
      stashPath = await stash(libName, globalName, this.cacheDir);
      this.stashMap.set(libName, stashPath);
    }
    return stashPath;
  }

  async stashObject(
    obj: Record<string, string> | Array<[string, string]>
  ): Promise<string[]> {
    return eachExternal(obj, this.cacheDir, (libName, globalName) => this.stash(libName, globalName));
  }

  async resolve(
    source: string,
    importer: string | undefined,
    isResolved: boolean
  ): Promise<string | boolean | undefined> {
    if (this.stashed) {
      return this.stashMap.get(source);
    }

    const { resolveHook } = this;
    if (resolveHook) {
      const globalName = resolveHook(source, importer, isResolved);

      if (globalName && typeof globalName === 'string') {
        return this.stash(source, globalName);
      }

      return !!globalName;
    }
  }

  addHook(fn: ExternalFn): void {
    const { resolveHook } = this;
    if (!resolveHook) {
      this.resolveHook = fn;
      return;
    }

    this.resolveHook = (source: string, importer: string | undefined, isResolved: boolean) => {
      let val = resolveHook(source, importer, isResolved);
      if (!val) {
        val = fn(source, importer, isResolved);
      }
      return val;
    };
  }
}
