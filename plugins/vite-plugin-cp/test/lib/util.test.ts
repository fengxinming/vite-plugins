import { mkdtempSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { copy } from 'fs-extra';
import { describe, expect, it } from 'vitest';

import { changeName, makeCopy, stringify } from '../../src/util';

describe('lib/util', () => {
  describe('stringify', () => {
    it('returns a compact single-line representation of an object', () => {
      // inspect with breakLength:Infinity collapses to one line — used in
      // error messages for malformed targets.
      // inspect 用 breakLength:Infinity 压成单行——错误配置时
      // 给 target 一个紧凑表示。
      const out = stringify({ a: 1, b: 'two' });
      expect(out).toBe("{ a: 1, b: 'two' }");
      expect(out).not.toContain('\n');
    });

    it('handles primitives without throwing', () => {
      expect(stringify('hello')).toBe("'hello'");
      expect(stringify(42)).toBe('42');
      expect(stringify(null)).toBe('null');
      expect(stringify(undefined)).toBe('undefined');
    });
  });

  describe('changeName', () => {
    it('returns the original name when no rename is provided', () => {
      // No rename option → keep filename as-is so cp's dest path is the
      // glob's matched basename.
      // 没传 rename → 文件名保持原样，dest 路径直接用 glob 命中的 basename。
      expect(changeName('a.txt')).toBe('a.txt');
    });

    it('returns the static string when rename is a string', () => {
      expect(changeName('a.txt', 'renamed.txt')).toBe('renamed.txt');
    });

    it('returns the function result when rename is a function', () => {
      const rename = (name: string) => name.replace('.txt', '.bak');
      expect(changeName('a.txt', rename)).toBe('a.bak');
    });

    it('falls back to the original name when the rename function returns a falsy value', () => {
      // A user-provided rename that returns '' / null must NOT wipe the
      // filename — otherwise cp would write into the dest dir itself.
      // 用户传的 rename 返回 '' / null 时不能让文件名变空——
      // 否则 cp 会把目标写进 dest 目录本身。
      expect(changeName('a.txt', () => '')).toBe('a.txt');
      expect(changeName('a.txt', () => null as unknown as string)).toBe('a.txt');
      expect(changeName('a.txt', () => undefined as unknown as string)).toBe('a.txt');
    });
  });

  describe('makeCopy', () => {
    it('returns fs-extra copy directly when no transform is provided', () => {
      // Without a transform there is no need to read/rewrite — fs-extra.copy
      // streams the file straight to dest, which is what we want for the
      // hot path.
      // 没传 transform 时无需读+改写——fs-extra.copy 直接把文件流到 dest，
      // 这是热路径上的最优实现。
      expect(makeCopy(undefined)).toBe(copy);
    });

    it('returns a function that reads, transforms, and writes the file', async () => {
      const cacheDir = mkdtempSync(join(tmpdir(), 'vpcp-util-'));
      const src = join(cacheDir, 'in.txt');
      const dest = join(cacheDir, 'out.txt');
      writeFileSync(src, 'hello');

      const transform = (buf: Buffer) => buf.toString().toUpperCase();
      const cp = makeCopy(transform);
      expect(typeof cp).toBe('function');
      expect(cp).not.toBe(copy);

      await cp(src, dest);
      // transform ran on the buffer; dest holds the uppercased content.
      // transform 在 buffer 上执行；dest 拿到的是大写后的内容。
      const written = await readFile(dest, 'utf-8');
      expect(written).toBe('HELLO');
    });

    it('passes the matched source path to the transform callback', async () => {
      // transform gets (buf, matchedPath) — verified by reading the
      // matchedPath back through the transform output.
      // transform 收到 (buf, matchedPath)——通过 transform 输出
      // 回读 matchedPath 来验证。
      const cacheDir = mkdtempSync(join(tmpdir(), 'vpcp-util-path-'));
      const src = join(cacheDir, 'in.txt');
      const dest = join(cacheDir, 'out.txt');
      writeFileSync(src, '');

      const cp = makeCopy((_buf: Buffer, matchedPath: string) => matchedPath);
      await cp(src, dest);
      // The dest file content equals the matched source path.
      // dest 文件内容等于 matched 源路径。
      expect(await readFile(dest, 'utf-8')).toBe(src);
    });

    it('forwards async transforms (Promise<string|Buffer>)', async () => {
      const cacheDir = mkdtempSync(join(tmpdir(), 'vpcp-util-async-'));
      const src = join(cacheDir, 'in.txt');
      const dest = join(cacheDir, 'out.txt');
      writeFileSync(src, 'raw');

      const cp = makeCopy(async (buf: Buffer) => `${buf.toString()}+async`);
      await cp(src, dest);
      expect(await readFile(dest, 'utf-8')).toBe('raw+async');
    });
  });
});
