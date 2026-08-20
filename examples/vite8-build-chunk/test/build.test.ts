import { execSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

const root = join(__dirname, '..');

function build(n: number) {
  execSync(`pnpm run build:${n}`, { cwd: root, stdio: 'pipe' });
}

function read(...segments: string[]) {
  return readFileSync(join(root, ...segments), 'utf-8');
}

afterEach(() => {
  for (const dir of ['dist', 'chunks']) {
    const p = join(root, dir);
    if (existsSync(p)) {
      rmSync(p, { recursive: true, force: true });
    }
  }
});

describe('vite-plugin-build-chunk example configs', () => {
  it('config 1: ES + UMD secondary build', () => {
    build(1);
    // Main build: ES format.
    const esFile = join(root, 'dist/1/my-lib.js');
    expect(existsSync(esFile)).toBe(true);
    expect(read('dist/1/my-lib.js')).toContain('export');

    // Secondary build: UMD wrapper with global name MyLib.
    const umdFile = join(root, 'dist/1/my-lib.umd.js');
    expect(existsSync(umdFile)).toBe(true);
    const umdCode = read('dist/1/my-lib.umd.js');
    expect(umdCode).toContain('(function');
    expect(umdCode).toContain('MyLib');
  }, 60000);

  it('config 2: array — UMD (unminified) + CJS (minified)', () => {
    build(2);
    expect(existsSync(join(root, 'dist/2/my-lib.js'))).toBe(true);

    const umdCode = read('dist/2/my-lib.umd.js');
    expect(umdCode).toContain('(function');
    expect(umdCode).toContain('MyLib');
    // UMD is NOT minified → multi-line readable output.
    expect(umdCode.split('\n').length).toBeGreaterThan(3);

    // CJS is minified → single-line compact output.
    const cjsCode = read('dist/2/my-lib.cjs');
    expect(cjsCode).toMatch(/exports\./);
    expect(cjsCode.split('\n').length).toBeLessThanOrEqual(3);
  }, 60000);

  it('config 3: sourcemap + custom outDir + custom fileName', () => {
    build(3);
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
});
