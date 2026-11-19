import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { runBuild } from '../../shared/example-testkit';

/**
 * 真实使用场景测试：build 通过 `vite build` CLI 子进程执行（runBuild），
 * 与用户实际用法完全一致；不再注入捕获插件抓中间代码，而是直接读 dist 产物断言。
 *
 * 前提：两个示例配置都用 vite-plugin-external 把目标库（含子路径）externalize，
 * 拆出的子路径 import 才会保留进产物，而不是被整库打包进去。
 * es 产物留 es 子路径；cjs 产物经 separate-importer 的 generateBundle 替换为 lib 子路径。
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const dist = resolve(root, 'dist');

// 产物保留了源码注释（含 `from 'antd'` 这类示意文字），
// 负向断言"不再整体导入"前必须先剥掉注释，否则会误判。
function stripComments(code: string): string {
  return code.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
}


describe('vite-plugin-separate-importer (real `vite build` CLI, verify dist)', () => {
  it('config 1: antd 拆分为 es 子路径 + style；cjs 产物替换为 lib 子路径', async () => {
    const { code, stdout } = await runBuild(root, 'build', 1);
    expect(code, `build:1 failed\n${stdout}`).toBe(0);

    const esFile = resolve(dist, '1/index.mjs');
    const cjsFile = resolve(dist, '1/index.js');
    expect(existsSync(esFile)).toBe(true);
    expect(existsSync(cjsFile)).toBe(true);

    // es 产物：JS 模块拆成 antd/es/*，样式 side-effect import 也在。
    // 正则要求路径两端紧跟引号，避免 antd/es/button 误命中 antd/es/button/style。
    const es = readFileSync(esFile, 'utf-8');
    expect(es).toMatch(/["']antd\/es\/button["']/);
    expect(es).toMatch(/["']antd\/es\/input["']/);
    expect(es).toMatch(/["']antd\/es\/select["']/);
    expect(es).toMatch(/["']antd\/es\/button\/style["']/);
    expect(es).toMatch(/["']antd\/es\/input\/style["']/);
    expect(es).toMatch(/["']antd\/es\/select\/style["']/);
    // 不再整体导入 antd
    expect(stripComments(es)).not.toMatch(/from\s*["']antd["']/);

    // cjs 产物：generateBundle 把 es 子路径替换成 lib 子路径
    const cjs = readFileSync(cjsFile, 'utf-8');
    expect(cjs).toContain('require(');
    expect(cjs).toMatch(/["']antd\/lib\/button["']/);
    expect(cjs).toMatch(/["']antd\/lib\/input["']/);
    expect(cjs).toMatch(/["']antd\/lib\/select["']/);
    expect(cjs).toMatch(/["']antd\/lib\/button\/style["']/);
    expect(cjs).toMatch(/["']antd\/lib\/input\/style["']/);
    expect(cjs).toMatch(/["']antd\/lib\/select\/style["']/);
    // es 子路径不应残留在 cjs 产物里
    expect(cjs).not.toContain('antd/es/');
  }, 120000);

  it('config 2: lodash 拆分为 lodash/<fn> 子路径', async () => {
    const { code, stdout } = await runBuild(root, 'build', 2);
    expect(code, `build:2 failed\n${stdout}`).toBe(0);

    const esFile = resolve(dist, '2/index.js');
    expect(existsSync(esFile)).toBe(true);

    const es = readFileSync(esFile, 'utf-8');
    expect(es).toMatch(/["']lodash\/get["']/);
    expect(es).toMatch(/["']lodash\/set["']/);
    expect(es).toMatch(/["']lodash\/merge["']/);
    // 不再整体导入 lodash
    expect(stripComments(es)).not.toMatch(/from\s*["']lodash["']/);
  }, 120000);

  it('config 3: named re-export 拆分为子路径，renamed 按原名正确解析', async () => {
    const { code, stdout } = await runBuild(root, 'build', 3);
    expect(code, `build:3 failed\n${stdout}`).toBe(0);

    const esFile = resolve(dist, '3/index.js');
    expect(existsSync(esFile)).toBe(true);

    const es = readFileSync(esFile, 'utf-8');
    // re-export 被拆成子路径（rolldown 优化为 import default + 本地 export）
    expect(es).toMatch(/["']lodash\/get["']/);
    expect(es).toMatch(/["']lodash\/set["']/);
    expect(es).toMatch(/["']lodash\/merge["']/);
    // renamed：merge as mergeDeep → 绑定名 mergeDeep，但仍按原名 merge 解析到 lodash/merge
    expect(es).toMatch(/import\s+mergeDeep\s+from\s*["']lodash\/merge["']/);
    // 公开 API 保留：mergeDeep 仍被导出
    expect(es).toMatch(/export\s*{[^}]*mergeDeep[^}]*}/);
    // 不再整体 re-export lodash
    expect(stripComments(es)).not.toMatch(/from\s*["']lodash["']/);
  }, 120000);
});
