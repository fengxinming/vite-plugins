import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { cleanDist, type DevHandle, runBuild, runScript } from '../../shared/example-testkit';

const root = resolve(__dirname, '..');
const dist = resolve(root, 'dist');

let handle: DevHandle | null = null;

afterEach(async () => {
  if (handle) {
    await handle.close();
    handle = null;
  }
  cleanDist(root);
});

async function start(configName: string): Promise<{ baseUrl: string }> {
  // 每个 config 走独立端口（dev:1→5191 / dev:2→5192，见 package.json），
  // 由 afterEach 在用例结束后关闭，避免并发抢端口。
  handle = await runScript(root, 'dev', Number(configName));
  return { baseUrl: handle.baseUrl };
}

describe('vite-plugin-reverse-proxy example configs', () => {
  describe('build smoke (plugin does not break build)', () => {
    it('config 1: builds successfully', async () => {
      const { code, stdout } = await runBuild(root, 'build', 1);
      expect(code, `build:1 failed\n${stdout}`).toBe(0);
      expect(existsSync(resolve(dist, '1/index.html'))).toBe(true);
    }, 60000);

    it('config 2: builds successfully with preambleCode config present', async () => {
      const { code, stdout } = await runBuild(root, 'build', 2);
      expect(code, `build:2 failed\n${stdout}`).toBe(0);
      expect(existsSync(resolve(dist, '2/index.html'))).toBe(true);
    }, 60000);
  });

  describe('dev server: reverse-proxy core functionality', () => {
    it('config 1: GET /app.js returns a bootloader that loads src/main.ts + @vite/client', async () => {
      const { baseUrl } = await start('1');
      const res = await fetch(`${baseUrl}/app.js`);
      expect(res.ok).toBe(true);
      expect(res.headers.get('content-type')).toMatch(/javascript/);
      const body = await res.text();

      // reverse-proxy 的 dev 模式返回一段 bootloader（不是 inline 编译结果）：
      // 它向文档注入 <script> 来加载 @vite/client (HMR) 和被代理的真实源文件。
      expect(body).toMatch(/\/@vite\/client/); // Vite client HMR 注入
      expect(body).toMatch(/src\/main\.ts[^.]/); // 实际代理目标
      expect(body).not.toMatch(/preambleCode/); // Config 1 没有 preamble
    }, 60000);

    it('config 2: preamble injected + both /app.js and /vendor.js bootloaders valid', async () => {
      const { baseUrl } = await start('2');

      const [appRes, vendorRes] = await Promise.all([
        fetch(`${baseUrl}/app.js`),
        fetch(`${baseUrl}/vendor.js`)
      ]);
      expect(appRes.ok).toBe(true);
      expect(vendorRes.ok).toBe(true);
      expect(appRes.headers.get('content-type')).toMatch(/javascript/);
      expect(vendorRes.headers.get('content-type')).toMatch(/javascript/);

      const appBody = await appRes.text();
      const vendorBody = await vendorRes.text();

      // (a) preambleCode 被正确序列化注入到 preamble <script>
      expect(appBody).toContain('window.__PROXY__ = true');
      expect(vendorBody).toContain('window.__PROXY__ = true');

      // (b) 每个代理目标都有独立的真实源文件映射
      expect(appBody).toMatch(/src\/main\.ts[^.]/);
      expect(vendorBody).toMatch(/src\/vendor\.ts[^.]/);

      // (c) 都包含 @vite/client 以支持 HMR
      expect(appBody).toMatch(/\/@vite\/client/);
      expect(vendorBody).toMatch(/\/@vite\/client/);
    }, 60000);
  });
});
