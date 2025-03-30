import { readFile } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';
import { inspect } from 'node:util';

import { copy, outputFile } from 'fs-extra';

import { TransformFile } from './typings';
export function isObject<T = object>(v: unknown): v is T {
  return v !== null && typeof v === 'object';
}

export function stringify(value: any): string {
  return inspect(value, { breakLength: Infinity });
}

export function toAbsolutePath(pth: string, cwd: string): string {
  if (!isAbsolute(pth)) {
    pth = join(cwd, pth);
  }
  return pth;
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

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
