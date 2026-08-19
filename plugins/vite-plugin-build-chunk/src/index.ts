/*
 * vite-plugin-build-chunk — 构建后对单个 chunk 进行二次构建（打包为 UMD/ESM/CJS 等）
 * vite-plugin-build-chunk — Post-build secondary build on a single chunk (pack to UMD/ESM/CJS etc.)
 *
 * 整体流程 / Overall flow:
 *   1. 仅在 build 阶段生效（apply: 'build'），且 enforce: 'post' 保证在主构建完成后执行
 *   2. configResolved 记录原始 outDir，以便二次构建时定位到主构建输出的 chunk
 *   3. closeBundle（主构建完成后）对每个 chunk 配置并行触发一次独立的 vite.build() 调用
 *      以 lib 模式重新打包单个 chunk，生成指定 format（默认 UMD）的产物
 *
 * Hook 说明 / Hook breakdown:
 *   - name / apply / enforce: 插件元信息，限定执行时机
 *   - configResolved: 捕获 Vite 解析后的完整配置（主要读取 build.outDir）
 *   - closeBundle: 二次构建核心入口。主构建成功后（无 error），对每个 chunk
 *     用 lib 模式重新 vite.build()。设置 emptyOutDir=false 避免清空主构建产物。
 *     rolldownOptions.output.exports 透传给 Vite 8 的 Rolldown 打包器。
 *
 * 设计选择 / Why this design:
 *   - 二次构建走独立 vite.build()，而非直接操作 bundle：
 *     复用 Vite/Rolldown 的完整构建管线（minify、sourcemap、lib 模式命名等），无需自行重写。
 *     We call vite.build() again instead of manipulating bundle directly to reuse
 *     Vite/Rolldown's full pipeline (minify, sourcemaps, lib naming).
 *   - enforce: 'post' + closeBundle: 确保主构建已把 chunk 写入磁盘才能二次构建入口。
 *     enforce:'post' + closeBundle ensures the chunk is on disk before the 2nd build reads it.
 *   - Promise.all 并行：多个 chunk 配置可同时处理，缩短构建时间。
 *     Promise.all parallelism: multiple chunk configs run concurrently to reduce total build time.
 */
import { join } from 'node:path';

import type { Plugin } from 'vite';
import { build } from 'vite';

import type { Options } from './types';

export * from './types';

export default function pluginBuildChunk(opts: Options): Plugin {
  let buildOptions = opts.build;
  if (!Array.isArray(buildOptions)) {
    buildOptions = [buildOptions];
  }

  let originalOutDir;

  return {
    name: 'vite-plugin-build-chunk',
    apply: 'build',
    enforce: 'post',

    /*
     * configResolved 钩子 — 捕获 Vite 最终配置，记录主构建的输出目录
     * configResolved hook — Captures final Vite config, stores main build outDir
     *
     * 二次构建时 entry 路径是 `${originalOutDir}/${chunk}`，必须在这里拿到真实 outDir
     * The 2nd build entry resolves to `${originalOutDir}/${chunk}`; we need the real outDir here.
     */
    configResolved(config) {
      originalOutDir = config.build.outDir;
    },

    /*
     * closeBundle 钩子 — 主构建完成后，对每个 chunk 并行执行二次构建（lib 模式）
     * closeBundle hook — After main build finishes, runs parallel 2nd builds (lib mode) per chunk
     *
     * @param error 主构建错误；有错误则跳过，避免产物不一致
     *              Main build error; skip on error to avoid inconsistent artifacts.
     *
     * 每个 chunk 配置项含义：
     *   - chunk:    主构建产物中要二次打包的文件名（相对 outDir）
     *   - format:   输出格式，默认 umd
     *   - name:     UMD 全局名称
     *   - fileName: 自定义输出文件名，未提供时按 format 自动拼接扩展名
     *   - exports:  透传至 rolldownOptions.output.exports
     *   - plugins:  二次构建使用的额外 Vite 插件
     */
    async closeBundle(error) {
      if (error) {
        return;
      }
      await Promise.all(buildOptions.map(({
        chunk,
        minify,
        format = 'umd',
        name,
        sourcemap,
        outDir,
        fileName,
        exports,
        plugins
      }) => {
        return build({
          logLevel: 'silent',
          configFile: false,
          plugins,
          build: {
            outDir: outDir || originalOutDir,
            emptyOutDir: false,
            minify,
            sourcemap,
            lib: {
              entry: join(originalOutDir, chunk),
              name,
              formats: [format],
              fileName: fileName || ((format, entryName) => {
                return `${entryName}.${format === 'es' ? 'mjs' : format === 'cjs' ? 'js' : `${format}.js`}`;
              })
            },
            rolldownOptions: {
              output: {
                exports
              }
            }
          }
        });
      }));
    }
  };
}
