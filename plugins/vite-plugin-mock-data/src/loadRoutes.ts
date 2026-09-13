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
 *     2. 把转译后的 JS 写入 {cwd}/node_modules/.vite-plugin-mock-data/ 下的临时 .mjs 文件
 *        （文件名带源路径 hash，多个 mock 目录下的同名文件互不冲突）
 *     3. 再以动态 import() 加载临时 .mjs 的 default export
 *     4. 加载完成后在 finally 中删除临时 .mjs 文件（import 抛错也保证删除）
 *
 *   为什么临时文件不写在源文件同目录？/ Why not a sibling temp file:
 *   如果临时 .mjs 写在 mock 目录内，它会被 glob 的 *.mjs 模式重新匹配到。
 *   一旦删除失败（import 抛错 / 进程中断），残留的临时文件与源文件内容相同，
 *   同一份 RouteConfig 会被加载两次 → fastify 注册重复路由（FST_ERR_DUPLICATED_ROUTE）。
 *   放到 node_modules/.vite-plugin-mock-data/ 后，glob 扫描 mock 目录时
 *   物理上不可能命中，重复注册的根因被彻底消除。
 *
 *   Node require() / import() only natively understand JS/JSON. For .ts files we must:
 *     1. Use Vite's built-in transformWithOxc (Oxc transpiler) to *strip types only*,
 *        no syntax downlevel (ESNext preserved; equivalent to old transformWithEsbuild
 *        with loader:'ts', target:'esnext').
 *     2. Write the transpiled JS into a temp .mjs under
 *        {cwd}/node_modules/.vite-plugin-mock-data/ (file name hashed from the source
 *        path so same-named files in different mock dirs never collide).
 *     3. Dynamically import() the temp .mjs and read its default export.
 *     4. Delete the temp .mjs in a finally block (even when import() throws).
 *
 *   Temp files must NOT live next to the source: a sibling *.mjs would be re-matched
 *   by the glob below. If deletion ever fails (import() throws / process killed), the
 *   leftover temp file contains the exact same config as the source, so the same route
 *   gets registered twice → fastify FST_ERR_DUPLICATED_ROUTE. Keeping temp files under
 *   node_modules/.vite-plugin-mock-data/ makes it impossible for the mock-dir glob to
 *   match them, eliminating the duplicate-registration root cause.
 *
 * 为什么用 createRequire + CJS require 来处理 .js 文件？
 * / Why createRequire + CJS require for .js:
 *   .js 文件可能是 CJS 模块，require() 读取同步、速度快，且兼容用户已有的写法。
 *   通过 createRequire(import.meta.url) 让 ESM 环境下也能拿到 require()。
 *   .js files may be CJS; require() is synchronous, fast, and compatible with existing
 *   user code. createRequire(import.meta.url) gives us require() inside an ESM context.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join, parse } from 'node:path';

import { glob } from 'tinyglobby';
import { transformWithOxc } from 'vite';

import { logger, PLUGIN_NAME } from './logger';
import type { RouteConfig } from './types';

const _require = typeof require === 'function' ? require : createRequire(import.meta.url);

/**
 * Temp directory for transpiled mock files, shared by every mock dir of this project.
 * Kept under node_modules so `rm -rf node_modules` cleans it up along with everything
 * else, and git ignores it by default.
 */
function getTempDir(cwd: string, cacheDir?: string): string {
  return cacheDir ?? join(cwd, 'node_modules', '.vite-plugin-mock-data');
}

/*
 * getRoute — 加载单个 mock 文件并解析为 RouteConfig
 * getRoute — Loads a single mock file and resolves it to a RouteConfig
 *
 * @param filename  mock 文件的绝对路径
 *                  Absolute path to the mock file
 * @param tmpDir    转译临时文件目录
 *                  Directory for transpiled temp files
 * @returns         解析成功的 RouteConfig；未匹配后缀或导出为空则 undefined
 *                  Parsed RouteConfig; undefined if no matching extension or empty export
 *
 * 文件类型处理策略 / File-type strategies:
 *   - .ts / .mts: transformWithOxc 去类型 → 写临时 .mjs → import() → finally 删除临时文件
 *   - .js:         用 CJS require() 同步读取（支持 module.exports 写法）
 *   - .mjs:        动态 import() 读取 default（用户手写的 .mjs 文件不会被删除）
 *   - .json:       JSON.parse 同步读取
 */
async function getRoute(filename: string, tmpDir: string): Promise<RouteConfig | undefined> {
  logger.debug('Load mock file:', filename);

  const { ext, name } = parse(filename);
  const isTs = ext === '.ts' || ext === '.mts';
  if (isTs) {
    // Oxc auto-detects TypeScript based on the file extension and strips
    // types without lowering syntax (equivalent to `loader: 'ts'`,
    // `target: 'esnext'` previously used with `transformWithEsbuild`).
    const { code } = await transformWithOxc(readFileSync(filename, 'utf-8'), filename);
    const hash = createHash('sha256').update(filename).digest('hex').slice(0, 12);
    const tmpFile = join(tmpDir, `${hash}-${name}-${PLUGIN_NAME}.mjs`);
    await mkdir(tmpDir, { recursive: true });
    await writeFile(tmpFile, code);
    try {
      return (await import(tmpFile)).default;
    }
    finally {
      // Never leave the temp file behind — a leftover would be re-imported on
      // the next server start and register the same routes twice.
      await unlink(tmpFile).catch(() => {});
    }
  }

  switch (ext) {
    case '.js':
      return _require(filename);
    case '.mjs':
      return (await import(filename)).default;
    case '.json':
      return JSON.parse(readFileSync(filename, 'utf-8'));
  }
  return undefined;
}

/*
 * loadRoutes — 入口函数：递归加载 dir 下所有 mock 路由配置，写入传入的 routes 数组
 * loadRoutes — Entry point: recursively loads all mock route configs under dir, appends to routes array
 *
 * @param dir      mock 文件所在的目录（相对路径基于 process.cwd()）
 *                 Directory containing mock files (relative paths resolve against process.cwd())
 * @param routes   调用方传入的数组，所有解析成功的 RouteConfig 会 push 进去
 *                 Caller-provided array to which all resolved RouteConfig objects are pushed
 * @param cwd      项目根目录，用于定位临时文件缓存目录（默认 process.cwd()）
 *                 Project root used to locate the temp-file cache dir (defaults to process.cwd())
 * @param cacheDir 可选的自定义缓存目录，覆盖默认的 node_modules/.vite-plugin-mock-data
 *                 Optional custom cache dir, overrides the default node_modules/.vite-plugin-mock-data
 *
 * 并发策略：Promise.all 并行处理所有匹配文件（IO 密集型，并发加速加载）
 * Concurrency: Promise.all processes every matched file in parallel (IO-bound, concurrent load speeds up)
 */
export default async function loadRoutes(
  dir: string,
  routes: RouteConfig[],
  cwd = process.cwd(),
  cacheDir?: string
): Promise<void> {
  const tmpDir = getTempDir(cwd, cacheDir);
  const paths = await glob(`${dir}/**/*.{js,mjs,json,ts,mts}`, {
    absolute: true,
    // Never pick up transpiled temp files left behind by older plugin versions.
    // A leftover contains the exact same config as its source and would register
    // the same routes twice (fastify FST_ERR_DUPLICATED_ROUTE).
    ignore: [`**/*-${PLUGIN_NAME}.mjs`]
  });
  const configs = await Promise.all(paths.map((p) => getRoute(p, tmpDir)));
  for (const config of configs) {
    if (config) {
      routes.push(config);
    }
  }
}
