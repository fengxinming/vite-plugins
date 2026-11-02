import { name } from '../../package.json' with { type: 'json' };

/**
 * 集中管理插件常量，避免字面量散落在各模块。
 * 对外暴露的类型定义仍在 `types.ts`，本文件只放「值」类常量。
 *
 * 注意：`index.ts` 通过通配导出把这里的常量整体推到了对外 API 上，
 * 但其中多数只是 `collectRoutes.ts` 的实现细节（扫描 glob、临时文件后缀
 * 与其忽略规则、缓存目录名、插件名），真正面向用户的只有
 * `VIRTUAL_MOCK_ROUTES`。若要收窄对外面，改 index.ts 的导出方式即可。
 */


export const PLUGIN_NAME = name;

/** TS 转译临时文件缓存目录名（位于 node_modules 下，随 rm -rf node_modules 清理） */
export const MOCK_CACHE_DIR = '.vite-plugin-mock-data';

/** 扫描 mock 文件的 glob 模式（loadRoutes 共用） */
export const MOCK_ROUTE_GLOB = '**/*.{js,mjs,json,ts,mts}';

/** 转译临时文件后缀（含插件名，避免与用户文件冲突且可被 glob ignore 命中） */
export const MOCK_TEMP_SUFFIX = `-${PLUGIN_NAME}.mjs`;

/** 扫描时忽略转译临时文件的 glob */
export const MOCK_IGNORE_GLOB = `**/*${MOCK_TEMP_SUFFIX}`;

/**
 * 承载 mock 文件清单与路径编译选项的虚拟模块 id。
 *
 * 这个模块不落磁盘：buildMock 开启时由本插件的 `resolveId`/`load` 钩子用
 * 代码串生成其实体，把「只有构建期才知道的信息」注入运行时——mock 文件清单
 * 与按 fastify `routerOptions` 推导的编译选项（见 `createMockRoutesSource`）。
 *
 * 之所以要用虚拟模块而不是 `define`：`define` 的值会被 JSON 序列化，
 * 承载不了 import 语句与对象引用。
 */
export const VIRTUAL_MOCK_ROUTES = 'virtual:mock-routes';
