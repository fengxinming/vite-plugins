import { execSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

const root = join(__dirname, '..');

/** Build with stdout captured — returns combined stdout+stderr as a string. */
function buildCapture(n: number): string {
  return execSync(`pnpm run build:${n}`, {
    cwd: root,
    stdio: 'pipe',
    encoding: 'utf-8'
  });
}

afterEach(() => {
  const p = join(root, 'dist');
  if (existsSync(p)) {
    rmSync(p, { recursive: true, force: true });
  }
});

describe('vite-plugin-hook-use example configs', () => {
  it('config 1: builds successfully with hook logging', () => {
    // vite-plugin-hook-use 在两个时机写 stdout：
    //   1) `config` 钩子 — 打印 `env: {"command":"build","mode":"production",...}` JSON
    //   2) `closeBundle` 钩子 — 用 @clack/prompts 打印
    //      `=== Start ===` banner + 各钩子 `hookName(count)` 调用次数统计 + `=== End ===`
    // 所以必须真正验证 stdout 里有这些特征（不是只查 dist 文件存在 — 那是伪通过）。
    const stdout = buildCapture(1);

    // 1) 构建产物仍需存在（构建本身成功，不是 hook-use 把构建搞坏了）
    expect(existsSync(join(root, 'dist/1/index.js'))).toBe(true);

    // 2) 证明 config 钩子跑了：打印过 env JSON（至少有 command/build 字段）
    expect(stdout).toMatch(/"command"\s*:\s*"build"/);
    expect(stdout).toMatch(/"mode"\s*:\s*"production"/);

    // 3) 证明 closeBundle 钩子的日志输出块完整出现：Start → 若干 hook(count) → End
    expect(stdout).toContain('=== Start ===');
    expect(stdout).toContain('=== End ===');
    // 4) 至少包含一个构建期间一定会触发的钩子计数，
    //    比如 config(1) / buildStart(1) / transform(N) / closeBundle(1) 中的任一个。
    //    "hookName(" + 数字 + ")" 是插件的固定输出格式。
    expect(stdout).toMatch(/config\(\d+\)/);
    expect(stdout).toMatch(/closeBundle\(\d+\)/);
    // 5) 有至少一次 render 阶段的钩子（build 不是空转）
    expect(stdout).toMatch(/(buildStart|transform|renderChunk|generateBundle|writeBundle)\(\d+\)/);
  }, 60000);
});
