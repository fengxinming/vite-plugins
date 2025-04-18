import type { PreviewServer, ViteDevServer } from 'vite';
import { normalizePath } from 'vite';
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

const postfixRE = /[?#].*$/;
export function cleanUrl(url: string): string {
  return url.replace(postfixRE, '');
}
