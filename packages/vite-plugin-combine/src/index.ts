import { existsSync, readdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { EOL } from 'node:os';
import { dirname, isAbsolute, join, parse, relative } from 'node:path';

import camelCase from 'camelcase';
import replaceAll from 'fast-replaceall';
import { move } from 'fs-extra';
import { InputOption } from 'rollup';
import { globSync } from 'tinyglobby';
import { normalizePath, Plugin } from 'vite';

import { logFactory, logger, PLUGIN_NAME } from './logger';
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
  const exportDeclare: string[] = [];

  for (const file of files) {
    const { name, dir } = parse(file);
    const exportName = handleExport(name, file, nameExport);

    const relativeDir = relative(dirname(target), dir);
    const relativePath = `./${join(relativeDir, name)}`;

    importDeclare.push(`import ${exportName} from '${relativePath}';`);
    exportDeclare.push(exportName);
  }

  if (exportDeclare.length === 0) {
    return '';
  }

  let code = importDeclare.join(EOL) + EOL;
  const exportStr = exportDeclare.join(', ');

  if (exportsType === 'named' || exportsType === 'auto') {
    code += `export { ${exportStr} };${EOL}`;
  }
  else if (exportsType === 'default' || exportsType === 'auto') {
    code += `export default { ${exportDeclare.join(', ')} };${EOL}`;
  }
  else if (exportsType === 'none') {
    for (const name of exportDeclare) {
      code = replaceAll(code, ` ${name} from`, '');
    }
    code += 'export {};';
  }

  return code;
}

function makeESModuleCode(
  files: string[],
  absTarget: string,
  opts
): string {
  // 导出类型
  const exportsType = opts.exports || 'named';
  const { nameExport, beforeWrite } = opts;

  let mainCode = '';
  switch (exportsType) {
    case 'named':
    case 'default':
    case 'auto':
    case 'none':
      mainCode = spliceCode(files, absTarget, exportsType, nameExport);
      break;
  }

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

function sleep(time: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

export default function pluginCombine(opts: Options): Plugin {
  if (!opts) {
    opts = {} as Options;
  }

  const { src, logLevel } = opts;
  if (logLevel) {
    logFactory.updateLevel(logLevel);
  }

  // 当前工作目录
  const cwd = opts.cwd || process.cwd();

  const prefix = `${PLUGIN_NAME}-temp-`;
  const files = globSync(src, { cwd, absolute: true, ignore: `**/${prefix}**` });

  if (!files.length) {
    logger.warn(`No files found in "${src}".`);
    return null as unknown as Plugin;
  }

  logger.debug(`Found ${files.length} files in "${src}":`, files);

  // 组合到目标文件中
  const target = opts.target || 'index.js';

  // target 绝对地址
  const absTarget = normalizeTarget(cwd, target);

  const tempName = `${prefix}${Math.random().toString(36).slice(2)}`;
  const { ext: targetExt, dir: targetDir, name: targetName } = parse(absTarget);
  const tempInput = join(targetDir, tempName + targetExt);

  writeFileSync(tempInput, makeESModuleCode(files, absTarget, opts));
  logger.trace(`Temporary file "${tempInput}" has been created.`);

  const clean = (err?: any) => {
    try {
      unlinkSync(tempInput);
      logger.trace(`"${tempInput}" exists?`, existsSync(tempInput));
    }
    catch (e) {}
    offExit(clean);

    if (err != null) {
      logger.debug('Exit event received:', err);
    }
  };
  onExit(clean);

  let outDir;

  return {
    name: PLUGIN_NAME,
    enforce: ('enforce' in opts) ? opts.enforce : 'pre',

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

    configResolved({ root, build }) {
      outDir = join(root, build.outDir);
      logger.debug('OutDir:', outDir);
    },

    async closeBundle() {
      await sleep(1000);

      const { overwrite } = opts;
      const list = readdirSync(outDir);
      const promises: Array<Promise<void>> = [];

      for (const file of list) {
        const state =  statSync(join(outDir, file));
        if (state.isFile()) {
          if (file.startsWith(`${tempName}.`)) {
            const newPath = join(outDir, replaceAll(file, tempName, targetName));

            if (existsSync(newPath) && !overwrite) {
              logger.warn(`"${newPath}" already exists, please set overwrite to true.`);
            }
            else {
              const oldPath = join(outDir, file);
              promises.push(move(oldPath, newPath).then(() => {
                logger.info(`"${newPath}" has been created.`);
                logger.trace(`"${oldPath}" exists?`, existsSync(oldPath));
              }));
            }
          }
        }
      }
      Promise.allSettled(promises).then(clean);
    }
  };
}
