/*
 * vite-plugin-combine — 将一组源文件组合为一个统一的 ES Module 入口后参与 Vite 构建
 * vite-plugin-combine — Combines a set of source files into a single ES Module entry for Vite build
 *
 * 整体流程 / Overall flow:
 *   1. 参数校验与初始化：设置日志、打印 banner、解析 cwd
 *   2. glob 匹配 src 下所有源文件（空则直接返回不注册插件）
 *   3. 生成 "临时组合入口文件" 路径（absTarget），若已存在则抛错避免覆盖
 *   4. config 钩子：
 *        - 调用 makeESModuleCode 生成组合代码并写入临时文件
 *        - 把临时文件 + 原始源文件合并进 build.lib.entry
 *        - 返回合并后的 Vite 配置覆盖
 *   5. buildEnd 钩子：无论构建成功/失败，都删除临时组合文件（清理现场）
 *   6. 若用户配置了 dts，则追加 vite-plugin-dts 插件数组，一起处理类型声明
 *
 * 为什么需要"临时文件"？ / Why the temp file:
 *   Vite/Rolldown 的 entry 必须指向磁盘上真实存在的文件路径（而不能是内存中虚拟模块），
 *   所以要先把 import/export 代码写入一个临时目标文件，再把它加入 entry。
 *   Vite/Rolldown entries must point to real on-disk files (not in-memory virtual modules),
 *   so we write the combined imports/exports to a temp file and add it to entries.
 *
 * 为什么 buildEnd 要清理临时文件？ / Why buildEnd cleans it:
 *   临时文件只是构建过程中的桥梁，不应出现在用户项目或最终产物中，
 *   即使构建失败也要清理，避免下一次运行时误判"文件已存在"抛错。
 *   The temp file is only a build-time bridge; it must not remain in the user's project.
 *   Cleanup runs even on failure so subsequent runs won't hit "already exists" errors.
 *
 * 为什么 dts 条件返回 Plugin | Plugin[]：
 *   未开启 dts 时返回单个插件对象即可；开启时需要同时返回本插件 + dts 插件，
 *   利用 Vite 允许插件返回 Plugin[] 的能力进行组合。
 *   When dts is disabled, a single plugin suffices. When enabled, we return
 *   a Plugin[] array (this plugin + vite-plugin-dts) leveraging Vite's plugin-array support.
 */
import { existsSync, unlink, writeFileSync } from 'node:fs';
import { EOL } from 'node:os';

import type { InputOption } from 'rolldown';
import { globSync } from 'tinyglobby';
import type { Plugin } from 'vite';
import dts from 'vite-plugin-dts';
import { banner, toAbsolutePath } from 'vp-runtime-helper';

import { makeESModuleCode, rebuildInput } from './common';
import { logger, PLUGIN_NAME } from './logger';
import type { Options } from './types';
export * from './types';

export default function pluginCombine(opts: Options): Plugin | Plugin[] | undefined {
  if (!opts) {
    opts = {} as Options;
  }

  if (opts.enableBanner) {
    banner(PLUGIN_NAME);
  }

  const { src, logLevel } = opts;
  if (logLevel) {
    logger.level = logLevel;
  }

  const cwd = opts.cwd || process.cwd();
  const files = globSync(src, { cwd, absolute: true });

  if (!files.length) {
    logger.warn(`No files found in '${src}'.`);
    return;
  }

  logger.debug(`Found ${files.length} files in '${src}':`, files);

  const target = opts.target || 'index.js';
  const absTarget = toAbsolutePath(target, cwd);

  if (existsSync(absTarget)) {
    throw new Error(`File '${absTarget}' already exists.`);
  }

  /*
   * viteCombine 插件对象 — 核心执行逻辑
   * viteCombine plugin object — Core execution logic
   *
   * enforce 默认 'post'：确保在其它修改 lib.entry 的插件之后再合并
   *                      Defaults to 'post' to merge after other plugins modify lib.entry
   * apply 默认 'build'：仅构建阶段有效（开发服务器不需要组合入口）
   *                      Defaults to 'build' (dev server doesn't need combined entry)
   */
  const viteCombine = {
    name: PLUGIN_NAME,
    enforce: ('enforce' in opts) ? opts.enforce : 'post',
    apply: opts.apply ?? 'build',

    /*
     * config 钩子 — 写临时组合文件 + 合并进 build.lib.entry
     * config hook — Writes the combined temp file and merges it into build.lib.entry
     *
     * 步骤：
     *   1. makeESModuleCode 生成组合代码（imports/exports）
     *   2. writeFileSync 写入 absTarget（磁盘上真实存在的临时入口文件）
     *   3. rebuildInput 把 源文件 + 临时入口 合并进用户配置的 lib.entry
     *   4. 返回 { build: { lib: { entry } } } 让 Vite 合并配置
     */
    async config(config) {
      const combinedCode = makeESModuleCode(files, absTarget, opts);
      logger.debug(`Result:${EOL}${combinedCode}`);

      writeFileSync(absTarget, combinedCode, 'utf-8');

      const inputs = files.concat(absTarget);
      const { build } = config;
      let entry: InputOption | undefined;

      if (build) {
        const { lib } = build;

        if (lib && typeof lib === 'object') {
          entry = lib.entry;
          logger.debug('Original `lib.entry`:', entry);

          entry = rebuildInput(entry, inputs);
          logger.debug('New `lib.entry`:', entry);
        }
      }

      entry = entry || inputs;
      logger.debug('Entry:', entry);

      return {
        build: {
          lib: {
            entry
          }
        }
      };
    },

    /*
     * buildEnd 钩子 — 清理临时组合文件（absTarget）
     * buildEnd hook — Cleans up the temporary combined file (absTarget)
     *
     * 为什么在这里删：Vite 构建管线已经读完 entry 文件并完成打包，
     *                 此时临时文件不再需要，无论成功失败都应释放。
     * Why here: Vite has finished reading entries and bundling;
     *           the temp file is no longer needed and should be removed regardless of outcome.
     */
    buildEnd() {
      unlink(absTarget, (err) => {
        if (err) {
          return;
        }
        logger.debug(`'${absTarget}' has been removed.`);
      });
    }
  } as Plugin;

  /*
   * dts 条件返回：
   *   - 未配置 dts：直接返回单个 viteCombine 插件
   *   - dts === true：以默认参数启用 vite-plugin-dts
   *   - dts 为对象：作为配置透传，同时把源文件 + 临时入口加入 include，
   *                 保证 dts 插件能扫描到所有参与组合的模块
   * Conditional dts return:
   *   - dts unset: return single viteCombine plugin
   *   - dts === true: enable vite-plugin-dts with defaults
   *   - dts object: pass-through config, plus include sources + temp entry
   *                 so vite-plugin-dts scans all combined modules
   */
  let dtsOpts = opts.dts;
  if (!dtsOpts) {
    return viteCombine;
  }
  if (dtsOpts === true) {
    dtsOpts = {};
  }

  return [
    viteCombine,
    dts(
      Object.assign({
        include: files.concat(absTarget)
      }, dtsOpts)
    ) as Plugin
  ];
}
