import { isAbsolute, join } from 'node:path';

import figlet from 'figlet';
import { normalizePath, PreviewServer, ViteDevServer } from 'vite';

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
  return normalizePath(pth);
}

const postfixRE = /[?#].*$/;
export function cleanUrl(url: string): string {
  return url.replace(postfixRE, '');
}

export function isDevServer(
  server: ViteDevServer | PreviewServer,
): server is ViteDevServer {
  return 'pluginContainer' in server;
}

const VOLUME_RE = /^[A-Z]:/i;
export const FS_PREFIX = '/@fs/';
export function fsPathFromId(id: string): string {
  const fsPath = normalizePath(
    id.startsWith(FS_PREFIX) ? id.slice(FS_PREFIX.length) : id,
  );
  return fsPath.startsWith('/') || VOLUME_RE.test(fsPath) ? fsPath : `/${fsPath}`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export * from './colorful';
export * from './flattenId';
export * from './generateStarter';
export * from './getDepsCacheDir';
export * from './getHash';
export * from './getRuntimeVersion';
export * from './getValue';
export * from './logger';
export type { LogLevel } from 'base-log-factory';
