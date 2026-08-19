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

describe('vite-plugin-view example configs', () => {
  it('config 1: pug template → HTML', () => {
    build(1);
    const html = join(root, 'dist/1/index.html');
    expect(existsSync(html)).toBe(true);
    const code = read('dist/1/index.html');
    expect(code).toContain('My App');
  }, 60000);

  it('config 2: ejs template → HTML', () => {
    build(2);
    const html = join(root, 'dist/2/index.html');
    expect(existsSync(html)).toBe(true);
    const code = read('dist/2/index.html');
    expect(code).toContain('EJS Example');
    expect(code).toContain('Apple');
  }, 60000);

  it('config 3: nunjucks template → HTML', () => {
    build(3);
    const html = join(root, 'dist/3/index.html');
    expect(existsSync(html)).toBe(true);
    const code = read('dist/3/index.html');
    expect(code).toContain('Nunjucks Example');
  }, 60000);

  it('config 4: handlebars with .hbs extension', () => {
    build(4);
    const html = join(root, 'dist/4/index.html');
    expect(existsSync(html)).toBe(true);
    const code = read('dist/4/index.html');
    expect(code).toContain('Handlebars Example');
  }, 60000);

  it('config 5: pretty false — compact HTML output', () => {
    build(5);
    const html = join(root, 'dist/5/index.html');
    expect(existsSync(html)).toBe(true);
    const code = read('dist/5/index.html');
    expect(code).toContain('Compact Build');
  }, 60000);

  it('config 6: custom extension .template with ejs', () => {
    build(6);
    const html = join(root, 'dist/6/index.html');
    expect(existsSync(html)).toBe(true);
    const code = read('dist/6/index.html');
    expect(code).toContain('Custom Extension');
    expect(code).toContain('Alpha');
  }, 60000);

  it('config 7: MPA multi-page — BOTH dist/7/index.html + dist/7/home.html are built independently', () => {
    build(7);
    const indexOut = join(root, 'dist/7/index.html');
    const homeOut  = join(root, 'dist/7/home.html');

    // 1) Both HTML output files exist on disk — proves the `entry: { index, home }`
    //    object got correctly handed off to rolldownOptions.input.
    expect(existsSync(indexOut), 'dist/7/index.html must exist').toBe(true);
    expect(existsSync(homeOut), 'dist/7/home.html must exist').toBe(true);

    const indexHtml = read('dist/7/index.html');
    const homeHtml  = read('dist/7/home.html');

    // 2) Index page renders the items list (engineOptions merged for the MPA).
    expect(indexHtml).toContain('EJS Example');
    expect(indexHtml).toContain('Apple');
    expect(indexHtml).toContain('Banana');
    expect(indexHtml).toContain('Cherry');

    // 3) Home page renders its OWN template content (Multi-Page Example + the
    //    data-page attribute) — proves the two outputs are NOT both just
    //    copies of the same index page.
    expect(homeHtml).toContain('Multi-Page Example');
    expect(homeHtml).toContain('data-page="home"');
    expect(homeHtml).not.toContain('<li>Apple</li>'); // index-only content
  }, 60000);
});
