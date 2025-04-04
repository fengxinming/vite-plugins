import { join } from 'node:path';

import { outputFile } from 'fs-extra';
import { flattenId } from 'vp-runtime-helper';

import { ExternalFn, ExternalIIFE } from '../typings';
import { logger } from './logger';

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
  cb: (libName: string, globalName: string) => Promise<ExternalIIFE>
): Promise<ExternalIIFE[]> {
  if (Array.isArray(obj)) {
    const promises: Array<Promise<ExternalIIFE>> = [];

    for (const [libName, globalName] of obj) {
      promises.push(cb(libName, globalName));
    }

    return Promise.all(promises);
  }

  return eachExternal(Object.entries(obj), cb);
}

export class Resolver {
  stashed = false;
  readonly stashMap = new Map<string, ExternalIIFE>();
  private resolveHook?: ExternalFn;
  constructor(
    private readonly cacheDir: string
  ) {
  }

  async stash(libName: string, globalName: string): Promise<ExternalIIFE> {
    const { stashMap } = this;
    let info = stashMap.get(libName);
    if (info) {
      logger.trace(`"${libName}" has already been stashed, skipping.`);
      return info;
    }

    info = {
      name: globalName,
      external: libName,
      resolvedId: await stash(libName, globalName, this.cacheDir)
    };

    this.stashMap.set(libName, info);

    return info;
  }

  async stashObject(
    obj: Record<string, string> | Array<[string, string]>
  ): Promise<ExternalIIFE[]> {
    return eachExternal(
      obj,
      (libName, globalName) => this.stash(libName, globalName));
  }

  async resolve(
    source: string,
    importer: string | undefined,
    isResolved: boolean
  ): Promise<ExternalIIFE | true | undefined> {
    if (this.stashed) {
      return this.stashMap.get(source);
    }

    const { resolveHook } = this;
    if (resolveHook) {
      const globalName = resolveHook(source, importer, isResolved);

      if (globalName === true) {
        return true;
      }

      if (typeof globalName === 'string') {
        return this.stash(source, globalName);
      }
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
