import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { cleanDist, runBuild } from '../../shared/example-testkit';

const root = join(__dirname, '..');

/** Build with stdout captured — returns combined stdout+stderr as a string. */
async function buildCapture(n: number): Promise<string> {
  const { code, stdout } = await runBuild(root, 'build', n);
  if (code !== 0) {
    throw new Error(`build:${n} failed (code=${code})\n${stdout}`);
  }
  return stdout;
}

afterEach(() => {
  cleanDist(root);
});

describe('vite-plugin-hook-use example configs', () => {
  it('config 1: builds successfully with hook logging', async () => {
    // vite-plugin-hook-use 在两个时机写 stdout：
    //   1) `config` 钩子 — 打印 `env: {"command":"build","mode":"production",...}` JSON
    //   2) `closeBundle` 钩子 — 用 @clack/prompts 打印
    //      `=== Start ===` banner + 各钩子 `hookName(count)` 调用次数统计 + `=== End ===`
    // 所以必须真正验证 stdout 里有这些特征（不是只查 dist 文件存在 — 那是伪通过）。
    const stdout = await buildCapture(1);

    // 1) 构建产物仍需存在（构建本身成功，不是 hook-use 把构建搞坏了）
    expect(existsSync(join(root, 'dist/1/index.js'))).toBe(true);

    // 2) 证明 config 钩子跑了：打印过 env JSON（至少有 command/build 字段）
    expect(stdout).toMatch(/"command"\s*:\s*"build"/);
    expect(stdout).toMatch(/"mode"\s*:\s*"production"/);

    // 3) 证明 closeBundle 钩子的日志输出块完整出现：Start → 若干 hook(count) → End
    expect(stdout).toContain('=== Start ===');
    expect(stdout).toContain('=== End ===');

    // 4) 单次 build 里只跑一次的钩子，断言**精确次数**。
    //    原先用 \d+，连 config(0) 这种"钩子没被调用"的情况也会通过。
    expect(stdout).toMatch(/config\(1\)/);
    expect(stdout).toMatch(/buildStart\(1\)/);
    expect(stdout).toMatch(/generateBundle\(1\)/);
    expect(stdout).toMatch(/writeBundle\(1\)/);
    expect(stdout).toMatch(/closeBundle\(1\)/);

    // 5) transform 次数随模块数变化，只要求至少一次（不硬编码，避免加文件就挂）。
    expect(stdout).toMatch(/transform\([1-9]\d*\)/);

    // 6) 输出顺序：Start 在前、End 在后，且 config 早于 closeBundle。
    const startAt = stdout.indexOf('=== Start ===');
    const endAt = stdout.indexOf('=== End ===');
    expect(endAt).toBeGreaterThan(startAt);
    expect(stdout.indexOf('config(1)')).toBeLessThan(stdout.indexOf('closeBundle(1)'));
  }, 60000);
});
