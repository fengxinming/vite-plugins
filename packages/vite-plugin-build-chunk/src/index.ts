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
    configResolved(config) {
      originalOutDir = config.build.outDir;
    },
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
            rollupOptions: {
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
