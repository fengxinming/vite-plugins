/*
 * vite-plugin-mock-data/loadRoutes — 从文件系统加载 mock 路由配置
 * vite-plugin-mock-data/loadRoutes — Loads mock route configurations from the file system
 *
 * 整体作用 / Overall purpose:
 *   递归扫描指定目录下的 .js/.mjs/.json/.ts/.mts 文件，按文件类型加载并导出
 *   mock 路由配置对象（RouteConfig），收集到调用方传入的 routes 数组中。
 *   Recursively scans .js/.mjs/.json/.ts/.mts files under a directory, loads them
 *   as RouteConfig objects, and appends valid configs to the caller-provided routes array.
 *
 * 为什么用 oxc transform 处理 TS 文件？ / Why oxc transform for TS files:
 *   Node.js 的 require() 和动态 import() 原生只支持 JS/JSON/CJS/MJS，
 *   无法直接 require .ts 文件。所以对 TS 后缀文件：
 *     1. 用 Vite 内置的 transformWithOxc（Oxc 转译器）只剥离 TS 类型，
 *        不做语法降级（保持 ESNext，相当于以前的 transformWithEsbuild(loader:'ts', target:'esnext')）
 *     2. 把转译后的 JS 写入同目录下的临时 .mjs 文件
 *     3. 再以动态 import() 加载临时 .mjs 的 default export
 *     4. 加载完成后删除临时 .mjs 文件
 *   这样无需用户安装 ts-node 等额外工具，也避免 CJS/ESM 互操作问题。
 *   Node require() / import() only natively understand JS/JSON. For .ts files we must:
 *     1. Use Vite's built-in transformWithOxc (Oxc transpiler) to *strip types only*,
 *        no syntax downlevel (ESNext preserved; equivalent to old transformWithEsbuild
 *        with loader:'ts', target:'esnext').
 *     2. Write the transpiled JS into a sibling temporary .mjs file.
 *     3. Dynamically import() the temp .mjs and read its default export.
 *     4. Delete the temp .mjs after loading finishes.
 *   This avoids extra tools like ts-node, and sidesteps CJS/ESM interop issues.
 *
 * 为什么用 createRequire + CJS require 来处理 .js 文件？
 * / Why createRequire + CJS require for .js:
 *   .js 文件可能是 CJS 模块，require() 读取同步、速度快，且兼容用户已有的写法。
 *   通过 createRequire(import.meta.url) 让 ESM 环境下也能拿到 require()。
 *   .js files may be CJS; require() is synchronous, fast, and compatible with existing
 *   user code. createRequire(import.meta.url) gives us require() inside an ESM context.
 */
import { readFileSync } from 'node:fs';
import { unlink, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join, parse } from 'node:path';

import { glob } from 'tinyglobby';
import { transformWithOxc } from 'vite';

import { logger, PLUGIN_NAME } from './logger';
import { RouteConfig } from './types';

const _require = typeof require === 'function' ? require : createRequire(import.meta.url);

/*
 * getRoute — 加载单个 mock 文件并解析为 RouteConfig
 * getRoute — Loads a single mock file and resolves it to a RouteConfig
 *
 * @param filename  mock 文件的绝对路径
 *                  Absolute path to the mock file
 * @returns         解析成功的 RouteConfig；未匹配后缀或导出为空则 undefined
 *                  Parsed RouteConfig; undefined if no matching extension or empty export
 *
 * 文件类型处理策略 / File-type strategies:
 *   - .ts / .mts: transformWithOxc 去类型 → 写临时 .mjs → import() → 删除临时文件
 *   - .js:         用 CJS require() 同步读取（支持 module.exports 写法）
 *   - .mjs:        动态 import() 读取 default（注意：只有临时生成的 TS 产物 mjs 才会被删；
 *                  用户手写的 .mjs 文件不会删除，isTs 标记用于区分）
 *   - .json:       JSON.parse 同步读取
 */
async function getRoute(filename: string): Promise<RouteConfig | undefined> {
  logger.debug('Load mock file:', filename);

  // eslint-disable-next-line prefer-const
  let { ext, dir, name } = parse(filename);
  const isTs = ext === '.ts' || ext === '.mts';
  if (isTs) {
    // Oxc auto-detects TypeScript based on the file extension and strips
    // types without lowering syntax (equivalent to `loader: 'ts'`,
    // `target: 'esnext'` previously used with `transformWithEsbuild`).
    const { code } = await transformWithOxc(readFileSync(filename, 'utf-8'), filename);
    filename = join(dir, `${name}-${PLUGIN_NAME}.mjs`);
    ext = '.mjs';
    await writeFile(filename, code);
  }

  let config: RouteConfig | undefined;
  switch (ext) {
    case '.js':
      config = _require(filename);
      break;
    case '.mjs':
      config = (await import(filename)).default;
      if (isTs) {
        await unlink(filename);
      }
      break;
    case '.json':
      config = JSON.parse(readFileSync(filename, 'utf-8'));
      break;
  }
  return config;
}

/*
 * loadRoutes — 入口函数：递归加载 dir 下所有 mock 路由配置，写入传入的 routes 数组
 * loadRoutes — Entry point: recursively loads all mock route configs under dir, appends to routes array
 *
 * @param dir    mock 文件所在的目录（相对路径基于 process.cwd()）
 *               Directory containing mock files (relative paths resolve against process.cwd())
 * @param routes 调用方传入的数组，所有解析成功的 RouteConfig 会 push 进去
 *               Caller-provided array to which all resolved RouteConfig objects are pushed
 *
 * 并发策略：Promise.all 并行处理所有匹配文件（IO 密集型，并发加速加载）
 * Concurrency: Promise.all processes every matched file in parallel (IO-bound, concurrent load speeds up)
 */
export default async function loadRoutes(dir: string, routes: RouteConfig[]): Promise<void> {
  const paths = await glob(`${dir}/**/*.{js,mjs,json,ts,mts}`, { absolute: true });
  const configs = await Promise.all(paths.map(getRoute));
  for (const config of configs) {
    if (config) {
      routes.push(config);
    }
  }
}
