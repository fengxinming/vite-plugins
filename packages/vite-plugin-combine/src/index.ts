import { existsSync, unlink, writeFileSync } from 'node:fs';
import { EOL } from 'node:os';
import { dirname, isAbsolute, join, parse, relative } from 'node:path';

import { camelCase } from 'es-toolkit';
import { move, remove } from 'fs-extra';
import type { InputOption } from 'rollup';
import { glob, globSync } from 'tinyglobby';
import type { Plugin } from 'vite';
import { normalizePath } from 'vite';
import { banner } from 'vp-runtime-helper';

import { logger, PLUGIN_NAME } from './logger';
import { NameExport, Options } from './typings';
export * from './typings';

function onExit(listener: (...args: any[]) => any): void {
  process.on('exit', listener);
  process.on('SIGHUP', listener);
  process.on('SIGINT', listener);
  process.on('SIGTERM', listener);
  process.on('SIGBREAK', listener);
  process.on('uncaughtException', listener);
  process.on('unhandledRejection', listener);
}

function offExit(listener: (...args: any[]) => any): void {
  process.off('exit', listener);
  process.off('SIGHUP', listener);
  process.off('SIGINT', listener);
  process.off('SIGTERM', listener);
  process.off('SIGBREAK', listener);
  process.off('uncaughtException', listener);
  process.off('unhandledRejection', listener);
}

function handleExport(name: string, filePath: string, nameExport?: NameExport | boolean): string {
  if (nameExport) {
    switch (typeof nameExport) {
      case 'boolean':
        return camelCase(name);
      case 'function':
        return nameExport(name, filePath);
    }
  }
  return name;
}

// function namedExport(files: string[], target: string, nameExport?: NameExport | boolean): string {
//   return files
//     .map((file) => {
//       const { name, dir } = parse(file);
//       const exportName = handleExport(name, file, nameExport);
//       const relativeDir = relative(dirname(target), dir);
//       return `export { default as ${exportName} } from '${`./${join(relativeDir, name)}`}';`;
//     })
//     .join(EOL)
//     .concat(EOL);
// }

function spliceCode(
  files: string[],
  target: string,
  exportsType: string,
  nameExport?: NameExport | boolean
): string {
  const importDeclare: string[] = [];
  const exportNames: string[] = [];

  const handles = {
    named: {
      collect(exportName: string, relativePath: string) {
        importDeclare.push(`export { default as ${exportName} } from '${relativePath}';`);
      },
      end(code: string) {
        return code;
      }
    },
    default: {
      collect(exportName: string, relativePath: string) {
        importDeclare.push(`import ${exportName} from '${relativePath}';`);
        exportNames.push(exportName);
      },
      end(code: string) {
        return `${code}export default { ${exportNames.join(', ')} };${EOL}`;
      }
    },
    both: {
      collect(exportName: string, relativePath: string) {
        importDeclare.push(`import ${exportName} from '${relativePath}';`);
        exportNames.push(exportName);
      },
      end(code: string) {
        code += `export { ${exportNames.join(', ')} };${EOL}`;
        return `${code}export default { ${exportNames.join(', ')} };${EOL}`;
      }
    },
    all: {
      collect(exportName: string, relativePath: string) {
        importDeclare.push(`export * from '${relativePath}';`);
      },
      end(code: string) {
        return code;
      }
    },
    none: {
      collect(exportName: string, relativePath: string) {
        importDeclare.push(`import '${relativePath}';`);
      },
      end(code: string) {
        return `${code}export {};${EOL}`;
      }
    }
  };

  const fns = handles[exportsType];
  if (!fns) {
    return '';
  }

  const make = fns.collect;

  for (const file of files) {
    const { name, dir } = parse(file);
    const exportName = handleExport(name, file, nameExport);

    const relativeDir = relative(dirname(target), dir);
    const relativePath = `./${join(relativeDir, name)}`;

    make(exportName, relativePath);
  }

  return fns.end(importDeclare.join(EOL) + EOL);
}

function makeESModuleCode(
  files: string[],
  absTarget: string,
  opts
): string {
  // 导出类型
  const exportsType = opts.exports || 'named';
  const { nameExport, beforeWrite } = opts;

  let mainCode = spliceCode(files, absTarget, exportsType, nameExport);

  if (typeof beforeWrite === 'function') {
    const code = beforeWrite(mainCode);
    if (typeof code === 'string') {
      mainCode = code;
    }
  }
  logger.trace(`Result:${EOL}${mainCode}`);
  return mainCode;
}

function rebuildInput(input: InputOption | undefined, files: string[]): InputOption {
  const whatType = typeof input;
  if (whatType === 'string') {
    return [input as string].concat(files);
  }
  else if (Array.isArray(input)) {
    return input.concat(files);
  }
  else if (whatType === 'object' && input !== null) {
    return files.reduce((prev, cur) => {
      const obj = parse(cur);
      prev[obj.name] = cur;
      return prev;
    }, input as Record<string, string>);
  }
  return files;
}

function normalizeTarget(cwd: string, target: string) {
  let absTarget = target;

  if (!isAbsolute(absTarget)) {
    absTarget = join(cwd, absTarget);
  }
  absTarget = normalizePath(absTarget);
  return absTarget;
}

function getFiles(src: string | string[], cwd: string, prefix: string): string[] {
  return globSync(src, { cwd, absolute: true }).filter((f) => {
    if (f.includes(prefix)) {
      unlink(f, (e) => {
        if (e) {
          return;
        }
        logger.trace(`"${f}" has been deleted.`);
      });
      return false;
    }
    return true;
  });
}

export default function pluginCombine(opts: Options) {
  banner(PLUGIN_NAME);

  if (!opts) {
    opts = {} as Options;
  }

  const { src, logLevel } = opts;
  if (logLevel) {
    logger.level = logLevel;
  }

  // 当前工作目录
  const cwd = opts.cwd || process.cwd();

  const prefix = `${PLUGIN_NAME}-temp-`;
  const files = getFiles(src, cwd, prefix);

  if (!files.length) {
    logger.warn(`No files found in "${src}".`);
    return;
  }

  logger.debug(`Found ${files.length} files in "${src}":`, files);

  // 组合到目标文件中
  const target = opts.target || 'index.js';

  // target 绝对地址
  const absTarget = normalizeTarget(cwd, target);

  // 临时文件名
  const tempName = `${prefix}${Math.random().toString(36).slice(2)}`;
  const {
    ext: targetExt,
    dir: targetDir,
    name: targetName
  } = parse(absTarget);

  // 生成临时文件
  const tempInput = join(targetDir, tempName + targetExt);

  writeFileSync(tempInput, makeESModuleCode(files, absTarget, opts));
  logger.trace(`Temporary file "${tempInput}" has been created.`);

  const clearTemp = (err?: any) => {
    offExit(clearTemp);

    unlink(tempInput, (e) => {
      if (e) {
        return;
      }
      logger.trace(`"${tempInput}" has been deleted.`);
    });

    if (err !== void 0) {
      logger.debug('Exit event received:', err);
    }
  };
  onExit(clearTemp);

  // const version =  getRuntimeVersion();

  let isWatching;
  let outDir;

  return {
    name: PLUGIN_NAME,
    enforce: ('enforce' in opts) ? opts.enforce : 'post',

    async config(config) {
      const inputs = files.concat(tempInput);
      const { build } = config;

      if (build) {
        const { lib, rollupOptions } = build;
        let entry: InputOption;

        // 库模式
        if (lib && typeof lib === 'object') {
          entry = lib.entry;
          logger.debug('Original `lib.entry`:', entry);

          entry = rebuildInput(entry, inputs);
          logger.debug('New `lib.entry`:', entry);

          return {
            build: {
              lib: {
                entry
              }
            }
          };
        }

        // 可能配置了 input
        if (rollupOptions && typeof rollupOptions === 'object') {
          entry = rollupOptions.input as InputOption;
          logger.debug('Original `rollupOptions.input`:', entry);

          rebuildInput(entry, inputs);
          logger.debug('New `rollupOptions.input`:', entry);

          return {
            build: {
              rollupOptions: {
                input: entry
              }
            }
          };
        }
      }

      logger.debug('Entry:', inputs);
      return {
        build: {
          lib: {
            entry: inputs
          }
        }
      };
    },

    configResolved({ root, build, command }) {
      outDir = join(root, build.outDir);
      logger.debug('OutDir:', outDir);

      const isBuild = command === 'build';
      isWatching = isBuild && !!build.watch;
    },

    buildStart() {
      this.meta.watchMode = isWatching;
    },

    buildEnd() {
      this.meta.watchMode = isWatching;
    },

    generateBundle(_, bundle) {
      for (const [, chunkInfo] of Object.entries(bundle)) {
        const { fileName } = chunkInfo;

        // if (chunkInfo.type === 'chunk'
        //     && chunkInfo.facadeModuleId === tempInput
        //     && fileName.startsWith(chunkInfo.name)
        // ) {
        //   const outFile = fileName.replace(tempName, targetName);
        //   if (version.startsWith('3')) {
        //     this.emitFile({
        //       type: 'asset',
        //       fileName: outFile,
        //       originalFileName: join(outDir, outFile),
        //       source: chunkInfo.code
        //     });
        //   }
        //   else {
        //     this.emitFile({
        //       type: 'prebuilt-chunk',
        //       fileName: outFile,
        //       code: chunkInfo.code,
        //       exports: chunkInfo.exports,
        //       map: chunkInfo.map || undefined
        //     });
        //   }
        //   delete bundle[id];
        // }
        // else if (chunkInfo.type === 'asset' && fileName.startsWith(tempName)) {
        //   const outFile = fileName.replace(tempName, targetName);
        //   this.emitFile({
        //     type: 'asset',
        //     fileName: outFile,
        //     originalFileName: join(outDir, outFile),
        //     source: chunkInfo.source
        //   });
        //   delete bundle[id];
        // }
        if ((chunkInfo.type === 'chunk'
            && chunkInfo.facadeModuleId === tempInput
            && fileName.startsWith(chunkInfo.name))
            || (chunkInfo.type === 'asset'
                && fileName.startsWith(tempName))
        ) {
          chunkInfo.fileName = fileName.replace(tempName, targetName);
        }
      }
    },
    async closeBundle() {
      const files = await glob(`${outDir}/**/${tempName}.d.ts`, { cwd, absolute: true });
      await Promise.allSettled(files.map((file) => {
        const outFile = file.replace(tempName, targetName);
        return existsSync(outFile)
          ? remove(file)
          : move(file, outFile);
      }));
      setTimeout(clearTemp, opts.clearInDelay || 1000);
    }
  } as Plugin;
}
