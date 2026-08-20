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
  const p = join(root, 'dist');
  if (existsSync(p)) {
    rmSync(p, { recursive: true, force: true });
  }
});

/**
 * 从构建好的 JS 代码中提取被内联的 CSS 字符串（即 textContent = "..." 赋值里引号中的内容）。
 * 避免 CSS 属性顺序差异导致断言失败：同时允许 minified 格式。
 */
function extractInlineCss(code: string): string {
  // vite-plugin-include-css 典型输出： ... n.textContent="<css>" ...
  const m = /textContent\s*=\s*"([^"]*)"/.exec(code);
  return m ? m[1] : '';
}

describe('vite-plugin-include-css example configs', () => {
  it('config 1: style.css + reset.css BOTH truly inlined via <style> injection', () => {
    build(1);
    expect(existsSync(join(root, 'dist/1/my-component.js'))).toBe(true);
    const code = read('dist/1/my-component.js');

    // (a) 必须包含 <style> 标签的运行时注入 —— 不能宽泛匹配 "style" 单词
    //     因为用户 JS 里也有 innerHTML，所以要断言 CSS 注入机制本身。
    expect(code).toContain('document.createElement("style")');
    expect(code).toContain('document.head.appendChild');

    // (b) 必须有 vite-plugin-include-css 专属 catch / id
    expect(code).toContain('vite-plugin-include-css');
    expect(code).toMatch(/n\.id\s*=\s*"my-component_js"/);

    // (c) 提取内联的 CSS，断言两个源文件的规则都真正进入了 textContent
    const css = extractInlineCss(code);
    expect(css.length).toBeGreaterThan(100);

    // style.css: .component padding / background / border-radius / font-family
    expect(css).toMatch(/\.component\s*\{[^}]*padding\s*:\s*16px/);
    expect(css).toMatch(/\.component\s*\{[^}]*background\s*:\s*#f0f0f0/);
    expect(css).toMatch(/\.component\s*\{[^}]*border-radius\s*:\s*4px/);

    // reset.css: body color + font-family
    expect(css).toMatch(/body\s*\{[^}]*color\s*:\s*#333/);
    expect(css).toMatch(/body\s*\{[^}]*font-family\s*:\s*system-ui/);
  }, 60000);

  it('config 2: both formats (es + cjs) inlined, and CSS from BOTH files present', () => {
    build(2);
    // 两个输出文件都要存在（formats: ['es', 'cjs']）
    const cjsPath = join(root, 'dist/2/index.js');
    const esmPath = join(root, 'dist/2/index.mjs');
    expect(existsSync(cjsPath)).toBe(true);
    expect(existsSync(esmPath)).toBe(true);

    for (const file of [cjsPath, esmPath]) {
      const code = readFileSync(file, 'utf-8');

      // 注入机制（createElement + appendChild）
      expect(code).toContain('document.createElement("style")');
      expect(code).toContain('document.head.appendChild');
      expect(code).toContain('vite-plugin-include-css');

      // CSS 内容完整性
      const css = extractInlineCss(code);
      expect(css).toMatch(/\.component\s*\{[^}]*padding\s*:\s*16px/);
      expect(css).toMatch(/\.component\s*\{[^}]*border-radius\s*:\s*4px/);
      expect(css).toMatch(/body\s*\{[^}]*color\s*:\s*#333/);
      expect(css).toMatch(/body\s*\{[^}]*font-family\s*:\s*system-ui/);
    }
  }, 60000);
});
