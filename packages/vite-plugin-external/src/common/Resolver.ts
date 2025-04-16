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

  logger.trace(`Stashing a file: '${libPath}' for '${globalName}'.`);

  await outputFile(
    libPath,
    makeCjsExternalCode(globalName),
    'utf-8'
  );
  return libPath;
}

export class Resolver {
  readonly stashMap = new Map<string, ExternalIIFE>();
  private readonly resolveHooks: ExternalFn[] = [];
  constructor(
    private readonly cacheDir: string
  ) {
  }

  async stash(libName: string, globalName: string): Promise<ExternalIIFE> {
    const { stashMap } = this;
    let info = stashMap.get(libName);
    if (info) {
      logger.trace(`'${libName}' has already been stashed, skipping.`);
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

  async resolve(
    source: string,
    importer: string | undefined,
    isResolved: boolean
  ): Promise<ExternalIIFE | boolean> {
    const info = this.stashMap.get(source);
    if (info) {
      return info;
    }

    for (const resolveHook of this.resolveHooks) {
      const globalName = resolveHook(source, importer, isResolved);

      if (globalName === true) {
        return true;
      }

      if (typeof globalName === 'string') {
        return this.stash(source, globalName);
      }
    }

    return false;
  }

  useHook(hook: ExternalFn): this {
    this.resolveHooks.push(hook);
    return this;
  }
}
