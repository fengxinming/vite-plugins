import { describe, expect, it } from 'vitest';

import ExternalHook from '../../src/common/ExternalHook';

describe('common/ExternalHook', () => {
  describe('use(boolean)', () => {
    it('returns true for every id when arg is true', () => {
      const hook = new ExternalHook().use(true);
      const fn = hook.hooks[0];
      expect(fn('react', undefined, false)).toBe(true);
      expect(fn('vue', undefined, false)).toBe(true);
    });

    it('returns false for every id when arg is false', () => {
      const hook = new ExternalHook().use(false);
      const fn = hook.hooks[0];
      expect(fn('react', undefined, false)).toBe(false);
    });
  });

  describe('use(function)', () => {
    it('forwards the call as-is', () => {
      const spy = (id: string) => (id === 'react' ? 'React' : false);
      const hook = new ExternalHook().use(spy);
      const fn = hook.hooks[0];
      expect(fn('react', undefined, false)).toBe('React');
      expect(fn('vue', undefined, false)).toBe(false);
    });

    it('always returns false for virtual-module ids starting with \\0', () => {
      const spy = () => 'AlwaysMatch';
      const hook = new ExternalHook().use(spy);
      const fn = hook.hooks[0];
      // Virtual module ids must never be treated as external.
      // 虚拟模块 id 不应被识别为 external。
      expect(fn('\0some-plugin:virtual', undefined, false)).toBe(false);
      expect(fn('react', undefined, false)).toBe('AlwaysMatch');
    });
  });

  describe('use(Record<string, string>)', () => {
    it('returns the value of a hit key', () => {
      const hook = new ExternalHook().use({ react: 'React', vue: 'Vue' });
      const fn = hook.hooks[0];
      expect(fn('react', undefined, false)).toBe('React');
      expect(fn('vue', undefined, false)).toBe('Vue');
    });

    it('returns undefined for a miss', () => {
      const hook = new ExternalHook().use({ react: 'React' });
      const fn = hook.hooks[0];
      expect(fn('lodash', undefined, false)).toBeUndefined();
    });
  });

  describe('use(string | RegExp | Array)', () => {
    it('matches a plain string id', () => {
      const hook = new ExternalHook().use('react');
      const fn = hook.hooks[0];
      expect(fn('react', undefined, false)).toBe(true);
      expect(fn('react-dom', undefined, false)).toBe(false);
    });

    it('matches a RegExp', () => {
      const hook = new ExternalHook().use(/^node:/);
      const fn = hook.hooks[0];
      expect(fn('node:fs', undefined, false)).toBe(true);
      expect(fn('node:path', undefined, false)).toBe(true);
      expect(fn('fs', undefined, false)).toBe(false);
    });

    it('matches any item of an array (mixing string + RegExp)', () => {
      const hook = new ExternalHook().use(['react', /^vue/]);
      const fn = hook.hooks[0];
      expect(fn('react', undefined, false)).toBe(true);
      expect(fn('vue', undefined, false)).toBe(true);
      expect(fn('vue-router', undefined, false)).toBe(true);
      expect(fn('lodash', undefined, false)).toBe(false);
    });

    it('filters false / null / undefined entries inside an array', () => {
      // The implementation skips Boolean filtering before testing.
      // We use `as any` because the public type signature does not allow
      // mixing falsy values into the array — but at runtime users may
      // build the array dynamically and end up with stray false / null.
      // 实现里用 filter(Boolean) 提前清理了 falsy 项。
      // 公开类型签名不允许数组里混入 falsy 值，但运行时用户动态拼数组时
      // 可能出现，所以这里用 as any 模拟真实运行时场景。
      const hook = new ExternalHook().use(
        ['react', false, null, undefined] as any,
      );
      expect(hook.hooks).toHaveLength(1);
      const fn = hook.hooks[0];
      expect(fn('react', undefined, false)).toBe(true);
    });
  });

  describe('use(null | undefined)', () => {
    it('compiles to a never-match hook', () => {
      const hook = new ExternalHook().use(null as any);
      const fn = hook.hooks[0];
      expect(fn('anything', undefined, false)).toBe(false);
    });
  });

  describe('chaining — first truthy hook wins at the call site', () => {
    // ExternalHook itself does NOT short-circuit; the caller (Resolver.resolve
    // / setExternals) iterates and picks the first truthy return. So we only
    // verify that every registered hook is exposed in insertion order.
    // ExternalHook 自身不做短路；由调用方按顺序轮询。这里只验证注册顺序。
    it('exposes hooks in the order they were registered', () => {
      const hook = new ExternalHook()
        .use({ react: 'React' })
        .use('vue')
        .use(/^lodash/);

      expect(hook.hooks).toHaveLength(3);
      expect(hook.hooks[0]('react', undefined, false)).toBe('React');
      expect(hook.hooks[1]('vue', undefined, false)).toBe(true);
      expect(hook.hooks[2]('lodash', undefined, false)).toBe(true);
    });
  });
});
