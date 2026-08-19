/*
 * vite-plugin-combine/common — 代码拼接与构建入口合并工具函数
 * vite-plugin-combine/common — Code splicing & build-entry merging utilities
 *
 * 模块职责 / Module responsibilities:
 *   - handleExport: 根据 nameExport 策略把源文件名转换为最终导出名称
 *   - spliceCode:   核心代码拼接器，按 5 种 exports 策略（named/default/both/all/none）
 *                   生成组合文件的 import/export 代码
 *   - makeESModuleCode: 封装 spliceCode，增加 beforeWrite 钩子以允许用户自定义改写
 *   - rebuildInput: 将组合文件追加到用户原有的 build.lib.entry 配置中，
 *                   兼容 string/array/object 三种 InputOption 形式
 *
 * 为什么有 5 种 exports 策略？ / 5 export strategies rationale:
 *   不同库的消费场景不同：
 *   - named:   适合 Tree-shaking 友好的具名导出（默认）
 *   - default: 适合以对象形式统一访问所有子模块
 *   - both:    同时支持 named + default，兼容两种导入风格
 *   - all:     直接 re-export 子模块所有具名导出（非 default）
 *   - none:    仅 import 触发副作用，不导出任何内容（side-effect-only）
 */
import { EOL } from 'node:os';
import { dirname, join, parse, relative } from 'node:path';

import { camelize } from 'camel-kit';
import type { InputOption } from 'rollup';

import { NameExport } from './types';

/*
 * handleExport — 根据 nameExport 配置计算单个文件的最终导出名称
 * handleExport — Computes the final export name for a file based on nameExport config
 *
 * @param name       原始文件名（不含扩展名，如 'my-util'）
 *                   Original file name without extension (e.g. 'my-util')
 * @param filePath   文件绝对路径，函数形式的 nameExport 会接收到该参数
 *                   Absolute file path; passed to the function-style nameExport
 * @param nameExport 命名策略：
 *                     - false/undefined: 原样返回 name
 *                     - true:            用 camelize 转为驼峰（my-util -> myUtil）
 *                     - function:        自定义函数 (name, filePath) => string
 *                   Naming strategy:
 *                     - false/undefined: returns name as-is
 *                     - true:            camelize (my-util -> myUtil)
 *                     - function:        custom fn (name, filePath) => string
 */
export function handleExport(name: string, filePath: string, nameExport?: NameExport | boolean): string {
  if (nameExport) {
    switch (typeof nameExport) {
      case 'boolean':
        return camelize(name);
      case 'function':
        return nameExport(name, filePath);
    }
  }
  return name;
}

/*
 * spliceCode — 为一组源文件生成拼接后的 ES Module 代码（import/export 语句）
 * spliceCode — Generates spliced ES Module code (import/export statements) for a set of source files
 *
 * @param files       源文件绝对路径数组
 *                    Array of absolute paths to source files
 * @param target      目标拼接文件的绝对路径（用于计算相对 import 路径）
 *                    Absolute path to the target combined file (for relative import paths)
 * @param exportsType 导出策略：'named' | 'default' | 'both' | 'all' | 'none'
 *                    Export strategy: 'named' | 'default' | 'both' | 'all' | 'none'
 * @param nameExport  传递给 handleExport 的命名策略
 *                    Naming strategy forwarded to handleExport
 *
 * 策略使用方式 / Strategy usage:
 *   handles[exportsType] 提供 collect + end 两阶段：
 *     collect: 每个文件调用一次，累积 import/export 声明
 *     end:     全部处理后收尾（如追加 export default 对象）
 */
export function spliceCode(
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

/*
 * makeESModuleCode — 封装 spliceCode，并支持 beforeWrite 钩子供用户二次改写
 * makeESModuleCode — Wraps spliceCode with an optional beforeWrite hook for user customization
 *
 * @param files     源文件绝对路径数组
 *                  Array of absolute source file paths
 * @param absTarget 组合文件的绝对路径
 *                  Absolute path of the combined target file
 * @param opts      包含 exports / nameExport / beforeWrite
 *                  Contains exports / nameExport / beforeWrite options
 *
 * @returns         最终要写入临时入口文件的 ES Module 代码字符串
 *                  Final ES Module code string to write into the temp entry file
 */
export function makeESModuleCode(
  files: string[],
  absTarget: string,
  opts
): string {
  const exportsType = opts.exports || 'named';
  const { nameExport, beforeWrite } = opts;

  let mainCode = spliceCode(files, absTarget, exportsType, nameExport);

  if (typeof beforeWrite === 'function') {
    const code = beforeWrite(mainCode);
    if (typeof code === 'string') {
      mainCode = code;
    }
  }
  return mainCode;
}

/*
 * rebuildInput — 将组合入口文件及源文件追加到用户原有的 build.lib.entry 配置
 * rebuildInput — Appends combined entry + source files to user's existing build.lib.entry config
 *
 * @param input 原始 lib.entry 配置，可能为 string / string[] / Record<string,string> / undefined
 *              Original lib.entry config (string / string[] / Record<string,string> / undefined)
 * @param files 需要追加的入口路径数组（源文件 + 组合入口文件）
 *              Array of entry paths to append (sources + combined entry)
 *
 * 设计：lib.entry 三种合法形式都要保留用户的原始值（key/顺序），只做追加不覆盖。
 * Design: Preserves original structure & order/keys of all 3 valid entry forms, only appends.
 */
export function rebuildInput(input: InputOption | undefined, files: string[]): InputOption {
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
