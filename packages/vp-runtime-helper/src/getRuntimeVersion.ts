import { SpawnSyncReturns } from 'node:child_process';

import spawn from 'cross-spawn';
import { version } from 'vite';

export function getRuntimeVersion(): string {
  const { argv } = process;
  let viteVersion: string = '';
  try {
    const result: SpawnSyncReturns<Buffer> = spawn.sync(argv[0], [argv[1].includes('/vite/') ? argv[1] : 'vite', '-v']);
    const str = result.stdout.toString().trim();
    const matched = /.*vite\/([\d.]+)\s+/.exec(str);
    if (matched) {
      viteVersion = matched[1];
    }
    else {
      throw new Error(result.stderr.toString().trim() || 'Failed to get vite version.');
    }
  }
  catch (e) {
    console.warn((e as Error).message);
    viteVersion = version;
  }

  return viteVersion;
}
