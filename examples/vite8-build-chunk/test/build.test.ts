import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { cleanDir, runBuild } from '../../shared/example-testkit';

const root = join(__dirname, '..');

afterEach(() => {
  cleanDir(root, 'chunks');
});

async function build(n: number) {
  const { code, stdout } = await runBuild(root, 'build', n);
  if (code !== 0) {
    throw new Error(`build:${n} failed (code=${code})\n${stdout}`);
  }
}

function read(...segments: string[]) {
  return readFileSync(join(root, ...segments), 'utf-8');
}

describe('vite-plugin-build-chunk example configs', () => {
  it('config 1: ES + UMD secondary build', async () => {
    await build(1);
    // Main build: ES format.
    const esFile = join(root, 'dist/1/my-lib.js');
    expect(existsSync(esFile)).toBe(true);
    // 断言具体导出名，而不是仅验证出现 'export' 这个词。
    expect(read('dist/1/my-lib.js')).toMatch(/export \{[^}]*as add[^}]*as multiply[^}]*\}/);

    // Secondary build: UMD wrapper with global name MyLib.
    const umdFile = join(root, 'dist/1/my-lib.umd.js');
    expect(existsSync(umdFile)).toBe(true);
    const umdCode = read('dist/1/my-lib.umd.js');
    expect(umdCode).toContain('(function');
    expect(umdCode).toContain('MyLib');
  }, 60000);

  it('config 2: array — UMD (unminified) + CJS (minified)', async () => {
    await build(2);
    expect(existsSync(join(root, 'dist/2/my-lib.js'))).toBe(true);

    const umdCode = read('dist/2/my-lib.umd.js');
    expect(umdCode).toContain('(function');
    expect(umdCode).toContain('MyLib');
    // 未压缩 → 保留缩进与换行，正常是多行文件。
    expect(umdCode.split('\n').length).toBeGreaterThan(3);
    expect(umdCode).toMatch(/^\t/m);

    // 压缩 → 整个文件只有一行（实测零换行），且导出被压成 exports.xxx= 形式。
    const cjsCode = read('dist/2/my-lib.cjs');
    expect(cjsCode).toMatch(/exports\./);
    expect(cjsCode).toContain('exports.add=');
    expect(cjsCode.split('\n').length).toBeLessThanOrEqual(1);
  }, 60000);

  it('config 3: sourcemap + custom outDir + custom fileName', async () => {
    await build(3);
    // Main build output.
    expect(existsSync(join(root, 'dist/3/my-lib.js'))).toBe(true);

    // Secondary build in a separate directory.
    const bundleFile = join(root, 'dist/chunks/my-lib.bundle.js');
    expect(existsSync(bundleFile)).toBe(true);
    const code = read('dist/chunks/my-lib.bundle.js');
    expect(code).toContain('(function');
    expect(code).toContain('MyLib');
    // Inline sourcemap.
    expect(code).toContain('sourceMappingURL=data:');
  }, 60000);

  it('config 4: deprecated `chunk` alias resolves against the main outDir', async () => {
    await build(4);
    // Main build output.
    expect(existsSync(join(root, 'dist/4/my-lib.js'))).toBe(true);

    // Secondary build: `chunk: 'my-lib.js'` must be joined with the main
    // outDir. A cwd-relative resolution would not find the entry at all, so
    // the build above would have thrown.
    const legacyFile = join(root, 'dist/4/my-lib.legacy.umd.js');
    expect(existsSync(legacyFile)).toBe(true);
    const code = read('dist/4/my-lib.legacy.umd.js');
    expect(code).toContain('(function');
    expect(code).toContain('MyLib');
  }, 60000);
});
