import { isAbsolute, join } from 'path';
import type { Plugin } from 'vite';
import { build } from 'vite';

import type { Options } from './types';

export * from './types';

export default function pluginBuildChunk(opts: Options): Plugin {
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
     */
    async closeBundle(error) {
      if (error) {
        return;
      }

      let buildOptions = opts.build;
      if (!Array.isArray(buildOptions)) {
        buildOptions = [buildOptions];
      }

      await Promise.all(buildOptions.map(({
        chunk,
        format,
        plugins: legacyPlugin,
        resolve: legacyResolve,
        exports,
        name,
        fileName,
        entry,
        formats,
        cssFileName,
        outDir,
        emptyOutDir,
        output,
        ...rest
      }) => {
        if (!formats) {
          formats = [format ?? 'umd'];
        }
        if (!output) {
          output = { exports };
        }

        const { plugins, resolve } = opts;

        return build({
          logLevel: rest.logLevel ?? 'silent',
          configFile: false,
          plugins: plugins ?? legacyPlugin,
          resolve: resolve ?? legacyResolve,
          build: {
            ...rest,
            outDir: outDir ?? originalOutDir,
            emptyOutDir: emptyOutDir ?? false,
            lib: {
              entry: entry ?? (chunk ? isAbsolute(chunk) ? chunk : join(originalOutDir, chunk) : chunk),
              name,
              formats,
              fileName,
              cssFileName
            },
            rolldownOptions: {
              output
            }
          }
        });
      }));
    }
  };
}
