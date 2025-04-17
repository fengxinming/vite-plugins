import { join } from 'node:path';

import { outputFile } from 'fs-extra';
import { isAbsoluteURL } from 'is-what-type';
import { flattenId } from 'vp-runtime-helper';

import type { ExternalES, ExternalFn, ExternalIIFE } from '../typings';
import { logger } from './logger';

function makeStashFilePath(cacheDir: string, libName: string): string {
  return join(cacheDir, `${flattenId(libName)}.js`);
}

/** compat cjs and esm */
function makeCjsExternalCode(globalName: string): string {
  return `module.exports = ${globalName};`;
}

function makeEsExternalCode(link: string): string {
  return `export { default } from '${link}';
export * from '${link}';`;
}

export async function stash(libName: string, globalName: string, cacheDir: string): Promise<ExternalIIFE | ExternalES> {
  const libPath = makeStashFilePath(cacheDir, libName);
  logger.trace(`Stashing a file: '${libPath}' for '${globalName}'.`);

  let info: ExternalIIFE | ExternalES;
  let code;

  if (isAbsoluteURL(globalName)) {
    info = {
      external: libName,
      resolvedId: libPath,
      link: globalName,
      format: 'es'
    } as ExternalES;
    code = makeEsExternalCode(globalName);
  }
  else {
    info = {
      external: libName,
      resolvedId: libPath,
      name: globalName,
      format: 'iife'
    } as ExternalIIFE;
    code = makeCjsExternalCode(globalName);
  }

  await outputFile(
    libPath,
    code,
    'utf-8'
  );

  return info;
}

export class Resolver {
  readonly stashMap = new Map<string, ExternalIIFE | ExternalES>();
  private readonly resolveHooks: ExternalFn[] = [];
  constructor(
    private readonly cacheDir: string
  ) {
  }

  async stash(libName: string, globalName: string): Promise<ExternalIIFE | ExternalES> {
    const { stashMap } = this;
    let info = stashMap.get(libName);
    if (info) {
      logger.trace(`'${libName}' has already been stashed, skipping.`);
      return info;
    }

    info = await stash(libName, globalName, this.cacheDir);

    this.stashMap.set(libName, info);

    return info;
  }

  async resolve(
    source: string,
    importer: string | undefined,
    isResolved: boolean
  ): Promise<ExternalIIFE | ExternalES | boolean> {
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
