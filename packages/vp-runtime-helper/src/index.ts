import { isAbsolute, join } from 'node:path';

import figlet from 'figlet';

const escapeRegexRE = /[-/\\^$*+?.()|[\]{}]/g;
export function escapeRegex(str: string): string {
  return str.replace(escapeRegexRE, '\\$&');
}


export function banner(text: string, opts?: any): void {
  // eslint-disable-next-line no-console
  console.log(figlet.textSync(text, opts));
}

export function toAbsolutePath(pth: string, cwd: string): string {
  if (!isAbsolute(pth)) {
    pth = join(cwd, pth);
  }
  return pth;
}

export * from './colorsole';
export * from './flattenId';
export * from './getDepsCacheDir';
export * from './getHash';
export * from './getRuntimeVersion';
export * from './getValue';
