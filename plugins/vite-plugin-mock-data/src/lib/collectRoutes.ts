import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { isAbsolute, join, parse, resolve } from 'node:path';

import { isObject } from 'is-what-type';
import { globSync } from 'tinyglobby';
import { transformWithOxc } from 'vite';
import { toAbsolutePath } from 'vp-runtime-helper';

import type { RouteConfig } from '../types';
import { MOCK_CACHE_DIR, MOCK_IGNORE_GLOB, MOCK_ROUTE_GLOB, MOCK_TEMP_SUFFIX } from './constants';
import { logger } from './logger';

const _require = typeof require === 'function' ? require : createRequire(import.meta.url);

/**
 * Temp directory for transpiled mock files, shared by every mock dir of this project.
 * Kept under node_modules so `rm -rf node_modules` cleans it up along with everything
 * else, and git ignores it by default.
 */
function getTempDir(cwd: string, cacheDir?: string): string {
  if (!cacheDir) {
    return join(cwd, 'node_modules', MOCK_CACHE_DIR);
  }

  // 相对 cacheDir 以配置的 cwd 为基准，而不是 process.cwd()：
  // 两者在 monorepo 或从非项目根目录启动时可能不同，缓存会落到意料之外的位置。
  return isAbsolute(cacheDir) ? cacheDir : resolve(cwd, cacheDir);
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
    // `target: 'esnext'` previously used with `transformWithOxc`).
    const { code } = await transformWithOxc(readFileSync(filename, 'utf-8'), filename);
    const hash = createHash('sha256').update(filename).digest('hex').slice(0, 12);
    const tmpFile = join(tmpDir, `${hash}-${name}${MOCK_TEMP_SUFFIX}`);
    await mkdir(tmpDir, { recursive: true });
    await writeFile(tmpFile, code);
    try {
      const singleRoutes = await import(tmpFile);
      return singleRoutes.default ?? singleRoutes;
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


export function findMockFiles(dir: string, cwd: string) {
  return globSync(`${toAbsolutePath(dir, cwd)}/${MOCK_ROUTE_GLOB}`, {
    absolute: true,
    // Never pick up transpiled temp files left behind by older plugin versions.
    // A leftover contains the exact same config as its source and would register
    // the same routes twice (fastify FST_ERR_DUPLICATED_ROUTE).
    ignore: [MOCK_IGNORE_GLOB]
  });
}

/**
 * 把 `routes` 选项里的「文件型」项（string 目录/文件）解析成绝对路径清单，
 * 供构建期 `createMockRoutesSource` 注入虚拟模块。内联 RouteConfig 为 dev-only，
 * 不进入静态构建。
 */
export function resolveMockFiles(
  routes: RouteConfig | Array<RouteConfig | string> | string | undefined,
  cwd: string,
): string[] {
  let files: string[] = [];
  if (typeof routes === 'string') {
    files = files.concat(findMockFiles(routes, cwd));
  }
  else if (Array.isArray(routes)) {
    for (const route of routes) {
      if (typeof route === 'string') {
        files = files.concat(findMockFiles(route, cwd));
      }
    }
  }
  return files;
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
async function loadRoutes(
  dir: string,
  routes: RouteConfig[],
  cwd: string,
  cacheDir?: string
) {
  const paths = findMockFiles(dir, cwd);
  const tmpDir = getTempDir(cwd, cacheDir);
  const configs = await Promise.all(paths.map((p) => getRoute(p, tmpDir)));
  for (const config of configs) {
    if (config) {
      routes.push(config);
    }
  }
}


export async function collectRoutes(
  routes: RouteConfig | Array<RouteConfig | string> | string | undefined,
  allRoutes: RouteConfig[],
  cwd: string,
  cacheDir?: string
) {
  if (typeof routes === 'string') {
    logger.debug('Load routes from', routes);
    await loadRoutes(routes, allRoutes, cwd, cacheDir);
  }
  else if (Array.isArray(routes)) {
    for (const route of routes) {
      logger.debug('Load routes from', route);

      if (typeof route === 'string') {
        await loadRoutes(route, allRoutes, cwd, cacheDir);
      }
      else {
        allRoutes.push(route);
      }
    }
  }
  else if (isObject<RouteConfig>(routes)) {
    logger.debug('Load routes from', routes);
    allRoutes.push(routes);
  }
}
