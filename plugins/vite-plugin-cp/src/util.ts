import { readFile } from 'node:fs/promises';
import { inspect } from 'node:util';

import { copy, outputFile } from 'fs-extra';

import { TransformFile } from './typings';

export function stringify(value: any): string {
  return inspect(value, { breakLength: Infinity });
}

export function changeName(name: string, rename?: string | ((str: string) => string)) {
  if (typeof rename === 'function') {
    return rename(name) || name;
  }
  return rename || name;
}

export function makeCopy(transform?: TransformFile) {
  return typeof transform === 'function'
    ? function (from: string, to: string) {
      return readFile(from)
        .then((buf: Buffer) => transform(buf, from))
        .then((data: string | Buffer) => {
          return outputFile(to, data as any);
        });
    }
    : copy;
}
