import { isAbsolute, join } from 'node:path';

import { Options } from './typings';

export function buildOptions(opts: Options, mode: string): Options {
  let {
    cwd,
    cacheDir,
    externals,
    // eslint-disable-next-line prefer-const
    ...rest
  } = opts || {};
  const modeOptions: Options | undefined = opts[mode];

  if (modeOptions) {
    Object.entries(modeOptions).forEach(([key, value]) => {
      if (value) {
        switch (key) {
          case 'cwd':
            cwd = value;
            break;
          case 'cacheDir':
            cacheDir = value;
            break;
          case 'externals':
            externals = Object.assign({}, externals, value);
            break;
        }
      }
    });
  }

  if (!cwd) {
    cwd = process.cwd();
  }
  if (!cacheDir) {
    cacheDir = join(cwd, 'node_modules', '.vite_external');
  }
  else if (!isAbsolute(cacheDir)) {
    cacheDir = join(cwd, cacheDir);
  }

  return {
    ...rest,
    cwd,
    cacheDir,
    externals
  };
}
