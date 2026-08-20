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
  for (const dir of ['dist', 'deploy']) {
    const p = join(root, dir);
    if (existsSync(p)) {
      rmSync(p, { recursive: true, force: true });
    }
  }
});

describe('vite-plugin-cp example configs', () => {
  it('config 1: copy dist + rename file', () => {
    build(1);
    // Main build output.
    expect(existsSync(join(root, 'dist/1/my-lib.js'))).toBe(true);

    // Copied dist/1 contents to deploy/static.
    expect(existsSync(join(root, 'deploy/static/my-lib.js'))).toBe(true);

    // Copied + renamed to deploy/my-lib.esm.js.
    const renamed = join(root, 'deploy/my-lib.esm.js');
    expect(existsSync(renamed)).toBe(true);

    // Copied + transformed (sourcemap ref removed).
    const transformed = join(root, 'deploy/my-lib.min.js');
    expect(existsSync(transformed)).toBe(true);
    expect(read('deploy/my-lib.min.js')).not.toContain('sourceMappingURL');
  }, 60000);

  it('config 2: glob flatten + rename function', () => {
    build(2);
    expect(existsSync(join(root, 'dist/2/my-lib.js'))).toBe(true);

    // Glob src/**/*.ts flattened to dist/types/.
    expect(existsSync(join(root, 'dist/types/index.ts'))).toBe(true);

    // Renamed via function: index.ts → index.esm.ts.
    expect(existsSync(join(root, 'dist/index.esm.ts'))).toBe(true);
  }, 60000);

  it('config 3: transform content — JSON filter + CSS sourcemap strip', () => {
    build(3);
    expect(existsSync(join(root, 'dist/3/my-lib.js'))).toBe(true);

    // Transformed package.json: only name/version/main fields.
    const pkg = JSON.parse(read('dist/package.json'));
    expect(Object.keys(pkg).sort()).toEqual(['main', 'name', 'version']);
    expect(pkg.main).toBe('./my-lib.js');

    // Transformed CSS: sourcemap comment removed.
    const css = read('dist/style.css');
    expect(css).not.toContain('sourceMappingURL');
  }, 60000);
});
