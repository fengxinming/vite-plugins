import { describe, expect, it } from 'vitest';

import { createGlobalsFn } from '../../src/lib/handleGlobals';

describe('lib/handleGlobals', () => {
  describe('createGlobalsFn', () => {
    it('兜底到用户预先声明的函数形态 globals（表未命中时）', () => {
      const globals = createGlobalsFn({ react: 'React' }, (id: string) => `__${id}`);

      // react 在表里有映射 → 插件声明优先。
      expect(globals('react')).toBe('React');
      // lodash 没映射 → 兜底到用户的原始函数。
      expect(globals('lodash')).toBe('__lodash');
    });

    it('兜底到用户预先声明的对象形态 globals（表未命中时）', () => {
      const globals = createGlobalsFn({ react: 'React' }, { lodash: '_' });

      expect(globals('react')).toBe('React');
      expect(globals('lodash')).toBe('_');
    });

    /*
     * 表里没有 + 用户也没声明 globals：源码里 `globalName as string` 只是把
     * undefined 强转掉，实际仍返回 undefined。这是唯一让 Rolldown 拿到空全局名的分支，
     * 断言钉住当前行为，将来若改成抛错/回退这里会红。
     */
    it('表与用户声明都没有时返回 undefined（强转不改变实际值）', () => {
      const globals = createGlobalsFn({}, undefined);

      expect(globals('lodash')).toBeUndefined();
    });

    /*
     * 纯函数契约：config 钩子每轮都从原始配置重建，若这里偷改入参，
     * dev 重启就会在共享对象上累积。断言入参不被触碰。
     */
    it('不修改传入的 globalObject 与 originalGlobals', () => {
      const table: Record<string, string> = { react: 'React' };
      const original = { lodash: '_' };

      createGlobalsFn(table, original);

      expect(table).toEqual({ react: 'React' });
      expect(original).toEqual({ lodash: '_' });
    });
  });
});
