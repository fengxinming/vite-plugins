import { SpawnSyncReturns } from 'node:child_process';

import spawn from 'cross-spawn';

export function getRuntimeVersion(): string {
  const { argv } = process;
  let viteVersion: string = '';
  try {
    const result: SpawnSyncReturns<Buffer> = spawn.sync(argv[0], [argv[1], '-v']);
    const str = result.stdout.toString().trim();
    const matched = /.*vite\/([\d.]+)\s+/.exec(str);
    if (matched) {
      viteVersion = matched[1];
    }
    else {
      throw new Error(result.stderr.toString().trim() || 'Empty vite version.');
    }
  }
  catch (e) {
    console.error('Failed to get vite version.', e);
    viteVersion = '';
  }

  return viteVersion;
}
