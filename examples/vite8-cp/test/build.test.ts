import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { cleanDir, cleanDist, runBuild } from '../../shared/example-testkit';

const root = join(__dirname, '..');

async function build(n: number) {
  const { code, stdout } = await runBuild(root, 'build', n);
  if (code !== 0) {
    throw new Error(`build:${n} failed (code=${code})\n${stdout}`);
  }
}

function read(...segments: string[]) {
  return readFileSync(join(root, ...segments), 'utf-8');
}

afterEach(() => {
  cleanDist(root);
  cleanDir(root, 'deploy');
});

describe('vite-plugin-cp example configs', () => {
  it('config 1: copy dist + rename file', async () => {
    await build(1);
    // Main build output.
    expect(existsSync(join(root, 'dist/1/my-lib.js'))).toBe(true);

    const source = read('dist/1/my-lib.js');

    // Copied dist/1 contents to deploy/static —— 只验证落点与配置匹配。
    // 字节一致性由 fs 复制 API 保证，不属于插件行为。
    expect(existsSync(join(root, 'deploy/static/my-lib.js'))).toBe(true);

    // Copied + renamed to deploy/my-lib.esm.js —— 验证重命名后的文件名与配置匹配。
    expect(existsSync(join(root, 'deploy/my-lib.esm.js'))).toBe(true);

    // Copied + transformed (sourcemap ref removed)。
    // 期望值就是源文件按配置里的同一正则剥掉 sourcemap 注释后的结果。
    const transformed = join(root, 'deploy/my-lib.min.js');
    expect(existsSync(transformed)).toBe(true);
    const transformedCode = readFileSync(transformed, 'utf-8');
    expect(transformedCode).not.toContain('sourceMappingURL');
    expect(transformedCode).toBe(source.replace(/\/\/# sourceMappingURL=.*/, ''));
  }, 60000);

  it('config 2: glob flatten + rename function', async () => {
    await build(2);
    expect(existsSync(join(root, 'dist/2/my-lib.js'))).toBe(true);

    // Glob src/**/*.ts flattened to dist/types —— 验证拍平后的路径与配置匹配。
    expect(existsSync(join(root, 'dist/types/index.ts'))).toBe(true);

    // Renamed via function: index.ts → index.esm.ts —— 验证重命名结果。
    expect(existsSync(join(root, 'dist/index.esm.ts'))).toBe(true);
  }, 60000);

  it('config 3: transform content — JSON filter + CSS sourcemap strip', async () => {
    await build(3);
    expect(existsSync(join(root, 'dist/3/my-lib.js'))).toBe(true);

    // Transformed package.json: only name/version/main fields.
    const pkg = JSON.parse(read('dist/package.json'));
    expect(Object.keys(pkg).sort()).toEqual(['main', 'name', 'version']);
    expect(pkg.main).toBe('./my-lib.js');

    // Transformed CSS: 内容保留，只剥掉 sourcemap 注释。
    const css = read('dist/style.css');
    expect(css).not.toContain('sourceMappingURL');
    expect(css).toContain('.container');
    expect(css).toContain('960px');
  }, 60000);
});
