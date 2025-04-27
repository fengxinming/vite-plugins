import { EOL } from 'node:os';
import { dirname, join, parse, relative } from 'node:path';

import { camelize } from 'camel-kit';
import type { InputOption } from 'rollup';

import { NameExport } from './types';

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

export function makeESModuleCode(
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
  return mainCode;
}

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
