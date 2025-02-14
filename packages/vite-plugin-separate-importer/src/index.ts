import { EOL } from 'node:os';
import { init, parse } from 'es-module-lexer';
import {
  RenderedChunk,
  NormalizedOutputOptions,
  PluginContext
} from 'rollup';
import { Program, ImportSpecifier, ImportDefaultSpecifier, ImportNamespaceSpecifier } from 'acorn';

export interface RenderChunkOptions {
  code: string;
	chunk?: RenderedChunk;
	outputOptions?: NormalizedOutputOptions;
	meta?: { chunks: Record<string, RenderedChunk> };
}

export interface libConfig {
  /**
  * 待转换的库名称
  */
  name: string | string[];
  /**
   * 转换模块的函数
   */
  transformImporter?: (importer: string, libName: string, opts: RenderChunkOptions) => string;
  /**
   * 额外导入的模块
   */
  importExtra?: (importer: string, libName: string, opts: RenderChunkOptions) => string;
}

interface LibInfo extends libConfig {
 /**
  * 模块名称
  */
 name: string;
}

export interface Options {
 /**
  * 模块映射表
  */
 libs?: libConfig[];
}

/**
 * 处理命名导出的模块
 * process named export modules
 */
function processLibs(
  libName: string,
  specifiers: Array<ImportSpecifier | ImportDefaultSpecifier | ImportNamespaceSpecifier>,
  lib: LibInfo,
  opts: RenderChunkOptions
): string {
  const { transformImporter, importExtra } = lib;

  let newImportDeclarationStr = '';
  for (const specifier of specifiers) {
    switch (specifier.type) {
      case 'ImportDefaultSpecifier':
        if (importExtra) {
          newImportDeclarationStr += importExtra(specifier.local.name, libName, opts) + EOL;
        }
        break;

      case 'ImportSpecifier': {
        const importer = (specifier.imported as any).name;
        if (transformImporter) {
          const newModule = transformImporter(importer, libName, opts);
          if (newModule) {
            newImportDeclarationStr += `import ${importer} from "${newModule}";${EOL}`;
          }
        }
        if (importExtra) {
          newImportDeclarationStr += importExtra(importer, libName, opts) + EOL;
        }
        break;
      }
    }
  }

  return newImportDeclarationStr.slice(0, -2);
}

async function transform(
  this: PluginContext,
  opts: string | RenderChunkOptions,
  libMap: Record<string, LibInfo>
): Promise<string> {
  await init;

  const code = typeof opts === 'string' ? opts : opts.code;
  const [imports] = parse(code);
  // n: package name
  // s: start
  // e: end
  // ss: statement start
  // se: statement end
  // d: dynamic import
  // a: assert

  let dest = code;
  for (const { n: libName, ss: startIndex, se: endIndex } of imports) {
    // 申明语句字符串 Statement string
    const importStr = code.substring(startIndex, endIndex);

    // 忽略异常import申明语句 Ignore invalid import declaration
    if (!libName || importStr.startsWith('import(')) {
      continue;
    }

    // 抽象语法树对象 AST Node object
    const ast = this.parse(importStr) as Program;

    const statement = ast.body[0];

    const { type } = statement;

    // 只处理import语法 Only ImportDeclaration
    if (type !== 'ImportDeclaration') {
      continue;
    }

    const { specifiers } = statement;

    // matched package name
    const currentLib = libMap[libName];
    if (!currentLib) {
      continue;
    }

    // 处理模块 Process modules if it is valid
    const newImportStr = processLibs(libName, specifiers, currentLib, typeof opts === 'string' ? { code: opts } : opts);

    if (newImportStr) {
      dest = dest.replace(importStr, newImportStr);
    }
  }
  return dest;
}

function createPlugin(this: PluginContext, { libs = [] }: Options = {}) {
  if (!Array.isArray(libs) || libs.length === 0) {
    return;
  }

  const libMap: Record<string, LibInfo> = {};
  for (const lib of libs) {
    const { name, importExtra, transformImporter } = lib;

    const makeLibInfo = (n: string) => {
      libMap[n] = {
        name: n,
        transformImporter,
        importExtra
      };
    };

    if (transformImporter) {
      if (Array.isArray(name)) {
        name.forEach(makeLibInfo);
      }
      else {
        makeLibInfo(name);
      }
    }
  }

  return {
    name: 'vite-plugin-separate-importer',
    renderChunk(
      this: PluginContext,
      code: string,
      chunk: RenderedChunk,
      outputOptions: NormalizedOutputOptions,
      meta: { chunks: Record<string, RenderedChunk> }
    ) {
      return transform.call(this, { code, chunk, outputOptions, meta }, libMap);
    }
  };
}

export default createPlugin;
