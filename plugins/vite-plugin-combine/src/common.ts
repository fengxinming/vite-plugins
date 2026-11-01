/*
 * vite-plugin-combine/common — 代码拼接、入口合并与声明对齐工具函数
 * vite-plugin-combine/common — Code splicing, entry merging & declaration alignment utilities
 *
 * 模块职责 / Module responsibilities:
 *   - handleExport:      根据 nameExport 策略把源文件名转换为最终导出名称
 *   - spliceCode:        按 5 种 exports 策略生成组合文件的 import/export 代码
 *   - makeESModuleCode:  封装 spliceCode，追加 beforeWrite 钩子
 *   - rebuildInput:      把组合入口与源文件追加进 build.lib.entry（lib 模式）
 *   - appendEntry:       把组合入口追加进 build.input（app 模式）
 *   - getCommonParent:   计算 entryRoot，供 vite-plugin-dts 输出相对说明符
 *   - syncDeclarations:  让声明文件的扩展名与同名 JS 产物配对
 *
 * 为什么有 5 种 exports 策略？ / 5 export strategies rationale:
 *   - named:   具名导出，Tree-shaking 友好（默认）
 *   - default: 以对象形式统一访问所有子模块
 *   - both:    同时支持 named + default
 *   - all:     直接 re-export 子模块所有具名导出（非 default）
 *   - none:    仅 import 触发副作用
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, parse, relative, resolve, sep } from 'node:path';

import { camelize } from 'camel-kit';
import type { InputOption } from 'rolldown';

import type { CombineCodeOptions, NameExport } from './types';

/*
 * 固定使用 LF 作为换行符
 * Always use LF as the line separator
 *
 * 不用 os.EOL：同一份配置在 Windows 上会产出 CRLF，导致同一份代码在不同平台上的
 * 产物逐字节不同，git diff 也全是噪音。
 * Not os.EOL: it emits CRLF on Windows, so the same config produces byte-wise different
 * artifacts across platforms and floods git diffs.
 */
const EOL = '\n';

/*
 * JS 产物扩展名与 TS 声明扩展名的配对关系
 * Pairing between JS output extensions and TS declaration extensions
 *
 * TS 解析 './x.mjs' 时只认 'x.d.mts'，找不到就 TS2307；
 * 而 vite 在 package.json 无 type 字段时，es 产物是 .mjs、cjs 产物是 .cjs。
 * TS resolves './x.mjs' only against 'x.d.mts' (else TS2307), while Vite emits .mjs for es
 * and .cjs for cjs when package.json has no type field.
 */
const DECLARATION_EXTENSIONS: Record<string, string> = {
  '.js': '.d.ts',
  '.mjs': '.d.mts',
  '.cjs': '.d.cts'
};

/*
 * handleExport — 根据 nameExport 配置计算单个文件的最终导出名称
 * handleExport — Computes the final export name for a file based on nameExport config
 *
 * @param name       原始文件名（不含扩展名，如 'my-util'）
 *                   Original file name without extension (e.g. 'my-util')
 * @param filePath   文件绝对路径，函数形式的 nameExport 会接收到该参数
 *                   Absolute file path; passed to the function-style nameExport
 * @param nameExport 命名策略 / Naming strategy:
 *                     - false/undefined: 原样返回 / returns as-is
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
 * spliceCode — 为一组源文件生成组合后的 ES Module 代码
 * spliceCode — Generates the combined ES Module code for a set of source files
 *
 * @param files       源文件绝对路径数组 / Absolute source file paths
 * @param target      组合文件的绝对路径，用于计算相对说明符
 *                    Absolute path of the combined file, used to compute relative specifiers
 * @param exportsType 导出策略 / Export strategy:
 *                    'named' | 'default' | 'both' | 'all' | 'none'
 * @param nameExport  传递给 handleExport 的命名策略 / Forwarded to handleExport
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
    /*
     * 非法策略必须立刻失败：以前返回空串会生成一个空入口，构建照样"成功"，
     * 用户拿到的是没有任何导出的包，排查成本极高。
     * An invalid strategy must fail fast: returning an empty string used to produce an
     * empty entry, the build "succeeded", and users got a package exporting nothing.
     */
    throw new Error(
      `Invalid \`exports\` value: '${exportsType}'. Expected one of: ${Object.keys(handles).join(', ')}.`
    );
  }

  const make = fns.collect;

  for (const file of files) {
    const { name, dir } = parse(file);
    const exportName = handleExport(name, file, nameExport);

    /*
     * 说明符固定用 POSIX 分隔符：Windows 上 relative() 返回带反斜杠的路径，
     * 直接拼进 import 会得到 '.\util\x' 这种非法说明符。
     * Specifiers always use POSIX separators: on Windows relative() returns backslashes,
     * which would produce illegal specifiers like '.\util\x'.
     */
    const relativeDir = relative(dirname(target), dir).split(sep).join('/');
    const relativePath = relativeDir ? `./${relativeDir}/${name}` : `./${name}`;

    make(exportName, relativePath);
  }

  return fns.end(importDeclare.join(EOL) + EOL);
}

/*
 * makeESModuleCode — 封装 spliceCode，并支持 beforeWrite 钩子供用户二次改写
 * makeESModuleCode — Wraps spliceCode with an optional beforeWrite hook
 *
 * @param files     源文件绝对路径数组 / Absolute source file paths
 * @param absTarget 组合文件的绝对路径 / Absolute path of the combined file
 * @param opts      渲染用到的选项子集 / The option subset used for rendering
 *
 * @returns         最终写入组合入口的 ES Module 代码
 *                  Final ES Module code written into the combined entry
 */
export function makeESModuleCode(
  files: string[],
  absTarget: string,
  opts: CombineCodeOptions
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
 * rebuildInput — 把组合入口与源文件追加到用户原有的 build.lib.entry
 * rebuildInput — Appends the combined entry and sources to the user's build.lib.entry
 *
 * @param input 原始 lib.entry（string / string[] / Record<string,string> / undefined）
 *              Original lib.entry config
 * @param files 需要追加的入口路径（源文件 + 组合入口）
 *              Entry paths to append (sources + combined entry)
 *
 * 设计：三种合法形式都保留用户原始值的 key 与顺序，只做追加。
 * Design: preserves the keys and order of all three valid forms, only appending.
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
    /*
     * 先浅拷贝再追加：入参是用户 vite 配置里的对象，原地塞 key 会污染用户配置，
     * 后续插件读到的 lib.entry 已经不是他写的那份。
     * Shallow-copy before appending: the argument is the user's own config object, and
     * mutating it means later plugins see a lib.entry the user never wrote.
     */
    return files.reduce((prev, cur) => {
      const obj = parse(cur);
      prev[obj.name] = cur;
      return prev;
    }, { ...(input as Record<string, string>) });
  }
  return files;
}

/*
 * normalizeInput — 把 InputOption 的三种合法形态统一成 Record
 * normalizeInput — Normalizes all three valid InputOption forms into a Record
 *
 * 为什么要统一：app 模式下必须"追加一个入口"而不是"替换整个 input"，
 *               而 string / array 两种形态无法承载 key，直接 concat 会丢名字。
 * Why: In app mode we must append one entry instead of replacing the whole input, and
 *      string/array forms cannot carry a key, so a plain concat loses the name.
 */
function normalizeInput(input: InputOption | undefined): Record<string, string> {
  if (!input) {
    return {};
  }
  if (typeof input === 'string') {
    return { [parse(input).name]: input };
  }
  if (Array.isArray(input)) {
    return input.reduce<Record<string, string>>((acc, cur) => {
      acc[parse(cur).name] = cur;
      return acc;
    }, {});
  }
  return { ...input };
}

/*
 * appendEntry — 向用户已有的构建 input 追加一个具名入口
 * appendEntry — Appends one named entry to the user's build input
 *
 * 用于 app 模式：此时不能写 build.lib.entry（那会把项目强行变成库构建、顶掉 index.html），
 * 只能往 input 里追加。返回新对象，绝不修改入参。
 * Used in app mode: writing build.lib.entry would force a library build and drop index.html,
 * so we append into input instead. Returns a new object and never mutates the argument.
 */
export function appendEntry(input: InputOption | undefined, alias: string, file: string): InputOption {
  const normalized = normalizeInput(input);
  const existing = normalized[alias];

  if (existing && resolve(existing) !== resolve(file)) {
    throw new Error(
      `Entry name '${alias}' is already used by '${existing}' and conflicts with '${file}'.`
    );
  }

  normalized[alias] = file;
  return normalized;
}

/*
 * getCommonParent — 计算一组文件路径的公共父目录
 * getCommonParent — Computes the common parent directory of a set of file paths
 *
 * 用途：作为 vite-plugin-dts 的 entryRoot。
 *       声明的输出路径是 relative(entryRoot, 源文件)，说明符也据此推导；
 *       entryRoot 选错（例如落在构建目录上）会让说明符退化成本机绝对路径，
 *       产出的 .d.ts 发布到别的机器上完全不可用。
 * Purpose: Used as vite-plugin-dts `entryRoot`. Declaration output paths and specifiers are
 * derived from it; a wrong entryRoot degrades specifiers into machine-specific absolute paths.
 */
export function getCommonParent(files: string[]): string {
  if (!files.length) {
    return sep;
  }
  const segments = files.map((file) => dirname(resolve(file)).split(sep).filter(Boolean));
  let common = segments[0];

  for (const current of segments.slice(1)) {
    const next: string[] = [];
    for (let i = 0; i < Math.min(common.length, current.length); i++) {
      if (common[i] !== current[i]) {
        break;
      }
      next.push(common[i]);
    }
    common = next;
  }
  return common.length ? sep + common.join(sep) : sep;
}

/*
 * syncDeclarations — 让每个声明文件与同名 JS 产物的扩展名配对
 * syncDeclarations — Pairs every declaration file with its matching JS output extension
 *
 * vite-plugin-dts 只会产出 '<主干>.d.ts'，而产物可能是 .js / .mjs / .cjs；
 * TS 解析说明符时严格按扩展名配对（'./x.mjs' 只认 'x.d.mts'），否则 TS2307。
 * 因此遍历 outDir：对每个 '<主干>.d.ts'，若同目录存在 '<主干>.mjs' / '<主干>.cjs'，
 * 就复制出对应的 '.d.mts' / '.d.cts'。入口与源文件一视同仁——只处理入口时，
 * 深引用 'pkg/a.mjs' 依然解析不到声明。
 * vite-plugin-dts only emits '<stem>.d.ts' while outputs may be .js/.mjs/.cjs, and TS
 * resolves specifiers strictly ('./x.mjs' only matches 'x.d.mts'), otherwise TS2307.
 * So we walk outDir and copy '<stem>.d.ts' to '.d.mts'/'.d.cts' whenever the matching
 * '<stem>.mjs'/'.cjs' exists. Entry and per-file declarations alike.
 *
 * @returns 所有已存在或新生成的声明文件绝对路径
 *          Absolute paths of every existing or newly generated declaration
 */
export function syncDeclarations(outDir: string): string[] {
  const results: string[] = [];

  const walk = (dir: string): void => {
    if (!existsSync(dir)) {
      return;
    }

    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = resolve(dir, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }
      if (!entry.name.endsWith('.d.ts')) {
        continue;
      }

      results.push(fullPath);

      const stem = entry.name.slice(0, -'.d.ts'.length);
      for (const [jsExt, declExt] of Object.entries(DECLARATION_EXTENSIONS)) {
        if (declExt === '.d.ts' || !existsSync(resolve(dir, stem + jsExt))) {
          continue;
        }
        const dest = resolve(dir, stem + declExt);
        writeFileSync(dest, readFileSync(fullPath), 'utf-8');
        results.push(dest);
      }
    }
  };

  walk(outDir);
  return results;
}
