import { EOL } from 'node:os';

import { describe, expect, it } from 'vitest';

import { handleExport, makeESModuleCode, rebuildInput, spliceCode } from '../../src/common';

/**
 * Pure-string helper: build a fake absolute file path under a shared root so
 * the `relative()` arithmetic inside spliceCode is deterministic. spliceCode
 * only ever looks at the path string (parse + relative) — it never touches the
 * filesystem — so synthetic paths are sufficient and keep the tests hermetic.
 *
 * 纯字符串辅助：在共享 root 下构造假的绝对路径，让 spliceCode 内部的
 * relative() 运算确定。spliceCode 只读路径字符串（parse + relative），不碰
 * 文件系统，所以合成路径就够用，且让测试互不干扰。
 */
function file(name: string, root = '/fake/src'): string {
  return `${root}/${name}.ts`;
}

describe('common/handleExport', () => {
  it('returns the name as-is when nameExport is undefined', () => {
    // No nameExport → the caller wants the raw file basename as the export
    // identifier.
    // 未提供 nameExport → 调用方想要原始文件名作为导出标识。
    expect(handleExport('Foo', file('Foo'))).toBe('Foo');
  });

  it('returns the name as-is when nameExport is false', () => {
    // false is falsy → the `if (nameExport)` guard skips, falling back to name.
    // false 是 falsy → `if (nameExport)` 跳过，回退到原 name。
    expect(handleExport('Foo', file('Foo'), false)).toBe('Foo');
  });

  it('camelizes the name when nameExport is true', () => {
    // boolean true → run camelize so kebab-case file names become valid JS
    // identifiers ('my-comp' → 'myComp').
    // boolean true → 走 camelize，把 kebab-case 文件名转成合法 JS 标识符
    // （'my-comp' → 'myComp'）。
    expect(handleExport('my-comp', file('my-comp'), true)).toBe('myComp');
  });

  it('lowercases the leading capital when camelizing (Foo → foo)', () => {
    // camelize lower-cases the first character by default (non-pascal), so a
    // PascalCase filename becomes a lowerCamelCase export name.
    // camelize 默认把首字母小写（非 pascal 模式），PascalCase 文件名会变成
    // lowerCamelCase 导出名。
    expect(handleExport('Foo', file('Foo'), true)).toBe('foo');
  });

  it('delegates to the user function when nameExport is a function', () => {
    // The function receives (name, filePath) so users can derive export names
    // from the full path (e.g. namespace by directory) — its return value is
    // used verbatim.
    // 函数收到 (name, filePath)，用户可根据完整路径派生导出名
    // （如按目录加命名空间），返回值原样使用。
    const spy = (name: string, filePath: string) => `__${name}@${filePath}`;
    expect(handleExport('Foo', file('Foo'), spy)).toBe(`__Foo@${file('Foo')}`);
  });
});

describe('common/spliceCode', () => {
  describe('named exports (default)', () => {
    it('emits `export { default as <Name> } from <rel>` per file', () => {
      const code = spliceCode([file('Foo'), file('Bar')], file('index'), 'named');
      // Each file becomes a re-export of its default under the file's basename.
      // 每个文件以其文件名为别名重新导出其 default。
      expect(code).toBe(
        `export { default as Foo } from './Foo';${EOL}`
        + `export { default as Bar } from './Bar';${EOL}`,
      );
    });

    it('computes the relative path when files live in a sibling directory', () => {
      // Files under /fake/src/components, target under /fake/src → relative
      // path becomes './components/Name'.
      // 文件在 /fake/src/components，目标在 /fake/src → 相对路径变成
      // './components/Name'。
      const code = spliceCode(
        ['/fake/src/components/Button.ts'],
        '/fake/src/index.ts',
        'named',
      );
      expect(code).toBe(`export { default as Button } from './components/Button';${EOL}`);
    });
  });

  describe('default exports', () => {
    it('imports each as a binding and re-exports a single default object', () => {
      const code = spliceCode([file('Foo'), file('Bar')], file('index'), 'default');
      // `default` mode: import each module as a named binding, then export a
      // single default object aggregating them.
      // default 模式：把每个模块作为命名绑定 import，再聚合成一个 default 对象导出。
      expect(code).toBe(
        `import Foo from './Foo';${EOL}`
        + `import Bar from './Bar';${EOL}`
        + `export default { Foo, Bar };${EOL}`,
      );
    });
  });

  describe('both exports', () => {
    it('emits named exports AND a default object', () => {
      const code = spliceCode([file('Foo')], file('index'), 'both');
      // `both` mode = named re-exports + default object, so consumers can use
      // either `import { Foo }` or `import Lib from '...'` then `Lib.Foo`.
      // both 模式 = 命名导出 + default 对象，调用方既可 `import { Foo }`
      // 也可 `import Lib from '...'` 后 `Lib.Foo`。
      expect(code).toBe(
        `import Foo from './Foo';${EOL}`
        + `export { Foo };${EOL}`
        + `export default { Foo };${EOL}`,
      );
    });
  });

  describe('all exports', () => {
    it('emits `export * from <rel>` per file', () => {
      const code = spliceCode([file('Foo'), file('Bar')], file('index'), 'all');
      // `all` mode forwards every named export of each module — useful when the
      // sources export many members that should be flat-re-exported.
      // all 模式把每个模块的所有命名导出都转发出去——适合源模块导出很多成员、
      // 需要扁平再导出的场景。
      expect(code).toBe(
        `export * from './Foo';${EOL}`
        + `export * from './Bar';${EOL}`,
      );
    });
  });

  describe('none exports', () => {
    it('emits bare side-effect imports and an empty `export {}`', () => {
      const code = spliceCode([file('Foo')], file('index'), 'none');
      // `none` mode = import for side effects only, plus `export {}` to keep
      // the file a valid ESM module.
      // none 模式 = 仅 import 副作用，再加 `export {}` 让文件仍是合法 ESM。
      expect(code).toBe(
        `import './Foo';${EOL}`
        + `export {};${EOL}`,
      );
    });
  });

  it('returns an empty string for an unknown exportsType', () => {
    // Unknown mode → handles[exportsType] is undefined → spliceCode bails out
    // with '' so the caller (makeESModuleCode) writes an empty target file
    // rather than crashing.
    // 未知模式 → handles[exportsType] 为 undefined → spliceCode 返回空串，
    // 调用方（makeESModuleCode）写出空目标文件而不是崩溃。
    expect(spliceCode([file('Foo')], file('index'), 'totally-unknown')).toBe('');
  });

  it('honours a function-shape nameExport when building the export name', () => {
    // The nameExport callback flows through handleExport inside spliceCode, so
    // users can rewrite per-file export names (e.g. prefix by directory).
    // nameExport 回调在 spliceCode 内透传给 handleExport，用户可改写每个文件
    // 的导出名（如按目录加前缀）。
    const code = spliceCode(
      [file('Foo')],
      file('index'),
      'named',
      (name: string) => `__${name}`,
    );
    expect(code).toBe(`export { default as __Foo } from './Foo';${EOL}`);
  });
});

describe('common/makeESModuleCode', () => {
  it('defaults to named exports when opts.exports is not provided', () => {
    const code = makeESModuleCode([file('Foo')], file('index'), {});
    expect(code).toBe(`export { default as Foo } from './Foo';${EOL}`);
  });

  it('respects opts.exports when provided', () => {
    const code = makeESModuleCode([file('Foo')], file('index'), { exports: 'all' });
    expect(code).toBe(`export * from './Foo';${EOL}`);
  });

  it('lets opts.beforeWrite rewrite the final code when it returns a string', () => {
    // beforeWrite is an escape hatch for adding a header/banner or rewriting
    // the generated body; a string return replaces the code entirely.
    // beforeWrite 是加 header/banner 或改写生成体的逃生口；返回字符串会整体替换。
    const code = makeESModuleCode([file('Foo')], file('index'), {
      beforeWrite: (c: string) => `// banner\n${c}`
    });
    expect(code).toBe(`// banner\nexport { default as Foo } from './Foo';${EOL}`);
  });

  it('keeps the original code when beforeWrite returns a non-string', () => {
    // A non-string return (e.g. null/undefined) means "I inspected but did not
    // rewrite" → keep the generated code as-is.
    // 返回非字符串（如 null/undefined）表示「只检查不改写」→ 保留生成代码。
    const code = makeESModuleCode([file('Foo')], file('index'), {
      beforeWrite: () => null
    });
    expect(code).toBe(`export { default as Foo } from './Foo';${EOL}`);
  });
});

describe('common/rebuildInput', () => {
  it('prepends files to a string-form entry (returns an array)', () => {
    // A single string entry becomes [entry, ...files] so the combined target
    // joins the original entry without dropping it.
    // 单字符串 entry 变成 [entry, ...files]，组合目标加入原 entry 且不丢失。
    const result = rebuildInput('src/index.ts', ['/abs/Foo.ts', '/abs/Bar.ts']);
    expect(result).toEqual(['src/index.ts', '/abs/Foo.ts', '/abs/Bar.ts']);
  });

  it('concatenates files to an array-form entry', () => {
    const result = rebuildInput(['src/a.ts', 'src/b.ts'], ['/abs/Foo.ts']);
    expect(result).toEqual(['src/a.ts', 'src/b.ts', '/abs/Foo.ts']);
  });

  it('merges files into an object-form entry keyed by file basename', () => {
    // Object-form entry (multi-entry lib build): each file is added under its
    // basename so Vite emits one chunk per entry plus the combined ones.
    // 对象形式 entry（多入口 lib 构建）：每个文件按文件名加入，Vite 为每个
    // 入口产出一个 chunk，再加上组合入口。
    const input = { app: 'src/app.ts' };
    const result = rebuildInput(input, ['/abs/Foo.ts', '/abs/Bar.ts']);
    expect(result).toEqual({
      app: 'src/app.ts',
      Foo: '/abs/Foo.ts',
      Bar: '/abs/Bar.ts'
    });
  });

  it('mutates and returns the SAME object-form entry instance', () => {
    // rebuildInput reduces directly onto the passed object — callers should be
    // aware the input is mutated (not a copy).
    // rebuildInput 直接在传入对象上 reduce，调用方需注意入参会被修改（非拷贝）。
    const input = { app: 'src/app.ts' };
    const result = rebuildInput(input, ['/abs/Foo.ts']);
    expect(result).toBe(input);
  });

  it('returns files as-is when the entry is undefined', () => {
    // No prior entry → the combined files become the sole entry list.
    // 没有原 entry → 组合文件就是唯一的 entry 列表。
    const files = ['/abs/Foo.ts', '/abs/Bar.ts'];
    expect(rebuildInput(undefined, files)).toBe(files);
  });

  it('returns files as-is when the entry is null', () => {
    // null passes the `typeof === 'object'` check but fails `!== null`, so it
    // falls through to the files-only default.
    // null 通过 `typeof === 'object'` 但不满足 `!== null`，落到只返回 files
    // 的默认分支。
    const files = ['/abs/Foo.ts'];
    expect(rebuildInput(null as any, files)).toBe(files);
  });
});
