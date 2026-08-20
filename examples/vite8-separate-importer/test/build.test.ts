import { existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

import { build } from 'vite';
import { afterEach, describe, expect, it } from 'vitest';

const root = resolve(__dirname, '..');
const dist = resolve(root, 'dist');

afterEach(() => {
  if (existsSync(dist)) {
    rmSync(dist, { recursive: true, force: true });
  }
});

/**
 * 加载配置并运行 vite build，同时注入一个 post-transform 插件，
 * 用于捕获 separate-importer 插件 transform 后的源代码，
 * 再断言其中是否真正包含了子路径 import（验证拆分生效）。
 */
async function buildWithCapture(
  configName: string,
  captureFile: string
): Promise<{ capturedCode: string | null }> {
  let capturedCode: string | null = null;

  // 动态加载配置文件
  const configMod = await import(resolve(root, `vite.config.${configName}.mts`));
  const userConfig = configMod.default ?? configMod;

  await build({
    ...userConfig,
    logLevel: 'error',
    plugins: [
      ...(userConfig.plugins ?? []),
      {
        name: 'test:post-capture',
        enforce: 'post', // 在 separate-importer 之后执行，拿到拆分后的代码
        transform(code, id) {
          // 过滤掉虚拟模块和依赖，只捕获项目的源文件
          if (id.includes(captureFile) && !id.includes('node_modules')) {
            capturedCode = code;
          }
          return null;
        }
      }
    ]
  });

  return { capturedCode };
}

describe('vite-plugin-separate-importer example configs', () => {
  it('config 1: antd imports are SPLIT into antd/es/* sub-paths + style', async () => {
    const { capturedCode } = await buildWithCapture('1', 'src/index.ts');

    // 1. 构建产物存在
    expect(existsSync(resolve(dist, '1/index.js'))).toBe(true);
    expect(existsSync(resolve(dist, '1/index.mjs'))).toBe(true);

    // 2. 关键验证：captured code 必须体现拆分后的 import 路径
    //    （直接从最终 bundle 里看不出子路径，因为 lib build 会把 antd 打包进来）
    expect(capturedCode).not.toBeNull();
    const code = capturedCode!;

    // JS 模块路径：antd/es/button, antd/es/input, antd/es/select
    expect(code).toMatch(/["']antd\/es\/button["']/);
    expect(code).toMatch(/["']antd\/es\/input["']/);
    expect(code).toMatch(/["']antd\/es\/select["']/);

    // 样式 import：antd/es/*/style（insertSideEffect 配置生效）
    expect(code).toMatch(/["']antd\/es\/button\/style["']/);
    expect(code).toMatch(/["']antd\/es\/input\/style["']/);
    expect(code).toMatch(/["']antd\/es\/select\/style["']/);

    // 3. 不再出现原始整体导入 `from "antd"`（除注释以外）
    const nonComment = code.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(nonComment).not.toMatch(/from\s+["']antd["']/);
  }, 120000);

  it('config 2: lodash imports are SPLIT into lodash/<fn> sub-paths', async () => {
    const { capturedCode } = await buildWithCapture('2', 'src/lodash-demo.ts');

    // 1. 构建产物存在（es 单 format 时 Vite 输出 .js 扩展名）
    expect(existsSync(resolve(dist, '2/index.js'))).toBe(true);

    // 2. separate-importer 实际拆分了 3 个方法：get / set / merge
    expect(capturedCode).not.toBeNull();
    const code = capturedCode!;

    // 被拆成子路径（注意 lodash 这里 kebab: get→get, set→set, merge→merge，
    // 所以路径会是 "lodash/get"、"lodash/set"、"lodash/merge"）
    expect(code).toMatch(/["']lodash\/get["']/);
    expect(code).toMatch(/["']lodash\/set["']/);
    expect(code).toMatch(/["']lodash\/merge["']/);

    // 3. 不再出现整体导入 `from "lodash"`（除注释）
    const nonComment = code.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(nonComment).not.toMatch(/from\s+["']lodash["']/);
  }, 120000);
});
