import type { Rolldown } from 'vite';
import { describe, expect, it } from 'vitest';

import { setOutputGlobals } from '../../src/lib/handleGlobals';

describe('lib/handleGlobals', () => {
  describe('setOutputGlobals — default branch (no externalGlobals)', () => {
    it('installs a function-shape output.globals that asks the resolver first', () => {
      const rolldownOptions: Rolldown.RolldownOptions = {
        output: { format: 'iife' }
      };
      // Resolver maps react → React, vue → Vue (simulates the resolveHook
      // built by setExternals for an externals Record).
      // 模拟 setExternals 构建的 resolveHook：react → React、vue → Vue。
      const getGlobalName = (id: string) =>
        (id === 'react' ? 'React' : id === 'vue' ? 'Vue' : undefined);

      setOutputGlobals(rolldownOptions, getGlobalName, {});

      const output = rolldownOptions.output as Rolldown.OutputOptions;
      const globals = output.globals as (id: string) => string;

      expect(typeof globals).toBe('function');
      expect(globals('react')).toBe('React');
      expect(globals('vue')).toBe('Vue');
    });

    it('falls back to the original function-shape output.globals for unknown libs', () => {
      const originalGlobals = (id: string) => `__${id}`;
      const rolldownOptions: Rolldown.RolldownOptions = {
        output: { format: 'iife', globals: originalGlobals }
      };
      const getGlobalName = (id: string) => (id === 'react' ? 'React' : undefined);

      setOutputGlobals(rolldownOptions, getGlobalName, {});

      const output = rolldownOptions.output as Rolldown.OutputOptions;
      const globals = output.globals as (id: string) => string;

      // react has a string mapping in the resolver → plugin wins.
      // react 在 resolver 里有 string 映射 → 插件声明优先。
      expect(globals('react')).toBe('React');
      // lodash is NOT mapped → fall back to user's original function.
      // lodash 没映射 → 兜底到用户的原始函数。
      expect(globals('lodash')).toBe('__lodash');
    });

    it('falls back to the original object-shape output.globals for unknown libs', () => {
      const rolldownOptions: Rolldown.RolldownOptions = {
        output: {
          format: 'iife',
          globals: { lodash: '_' }
        }
      };
      const getGlobalName = (id: string) => (id === 'react' ? 'React' : undefined);

      setOutputGlobals(rolldownOptions, getGlobalName, {});

      const output = rolldownOptions.output as Rolldown.OutputOptions;
      const globals = output.globals as (id: string) => string;

      expect(globals('react')).toBe('React');
      expect(globals('lodash')).toBe('_');
    });

    it('treats resolver returning true (pure external) as "no global name" and falls back', () => {
      // Pure-externals (hook returns true) carry no global name; the
      // plugin must defer to the user's output.globals for the name.
      // 纯 external（hook 返回 true）没有全局名；插件要兜底用用户的
      // output.globals 拿名字。
      const rolldownOptions: Rolldown.RolldownOptions = {
        output: { format: 'iife', globals: { lodash: '_' } }
      };
      const getGlobalName = () => true as unknown as undefined;

      setOutputGlobals(rolldownOptions, getGlobalName, {});

      const output = rolldownOptions.output as Rolldown.OutputOptions;
      const globals = output.globals as (id: string) => string;
      expect(globals('lodash')).toBe('_');
    });

    it('installs globals on EVERY output entry when output is an array', () => {
      const rolldownOptions: Rolldown.RolldownOptions = {
        output: [
          { format: 'iife' },
          { format: 'es' }
        ]
      };
      const getGlobalName = (id: string) => (id === 'react' ? 'React' : undefined);

      setOutputGlobals(rolldownOptions, getGlobalName, {});

      const outputs = rolldownOptions.output as Rolldown.OutputOptions[];
      expect(Array.isArray(outputs)).toBe(true);
      expect(typeof outputs[0].globals).toBe('function');
      expect(typeof outputs[1].globals).toBe('function');
      expect((outputs[0].globals as (id: string) => string)('react')).toBe('React');
      expect((outputs[1].globals as (id: string) => string)('react')).toBe('React');
    });
  });

  describe('setOutputGlobals — escape-hatch branch (externalGlobals provided)', () => {
    it('prepends the user-provided Rolldown plugin to rolldownOptions.plugins', () => {
      const userPlugin: Rolldown.Plugin = {
        name: 'user-external-globals',
        resolveId() {
          return null;
        }
      };
      const externalGlobals = (globals: any) => {
        // The user receives a globals(id) lookup; they should be able to
        // call it to find the declared name. We just return the plugin.
        // 用户收到一个 globals(id) 反查函数；返回 Rolldown 插件即可。
        expect(typeof globals).toBe('function');
        return userPlugin;
      };

      const rolldownOptions: Rolldown.RolldownOptions = {
        external: () => true,
        output: { format: 'iife' }
      };
      const getGlobalName = (id: string) => (id === 'react' ? 'React' : undefined);

      setOutputGlobals(rolldownOptions, getGlobalName, { externalGlobals });

      expect(Array.isArray(rolldownOptions.plugins)).toBe(true);
      const plugins = rolldownOptions.plugins as Rolldown.Plugin[];
      expect(plugins[0]).toBe(userPlugin);
    });

    it('exposes a globals(id) lookup that returns the string mapping from the resolver', () => {
      // Verifies the callback's globals(id) returns 'React' for react and
      // undefined for unmapped libs (so users can fall back themselves).
      // 验证回调的 globals(id) 对 react 返回 'React'，
      // 未映射的库返回 undefined（让用户自己兜底）。
      const userPlugin: Rolldown.Plugin = { name: 'user' };
      const externalGlobals = (globals: any) => {
        expect(typeof globals).toBe('function');
        expect(globals('react')).toBe('React');
        expect(globals('lodash')).toBeUndefined();
        return userPlugin;
      };

      const rolldownOptions: Rolldown.RolldownOptions = {
        external: () => true,
        output: { format: 'iife' }
      };
      const getGlobalName = (id: string) => (id === 'react' ? 'React' : undefined);

      setOutputGlobals(rolldownOptions, getGlobalName, { externalGlobals });

      const plugins = rolldownOptions.plugins as Rolldown.Plugin[];
      expect(plugins[0]).toBe(userPlugin);
    });

    it('preserves pre-existing rolldownOptions.plugins when prepending', () => {
      const existingPlugin: Rolldown.Plugin = { name: 'existing' };
      const userPlugin: Rolldown.Plugin = { name: 'user' };
      const externalGlobals = () => userPlugin;

      const rolldownOptions: Rolldown.RolldownOptions = {
        external: () => true,
        output: { format: 'iife' },
        plugins: [existingPlugin]
      };

      setOutputGlobals(rolldownOptions, () => undefined, { externalGlobals });

      const plugins = rolldownOptions.plugins as Rolldown.Plugin[];
      expect(plugins).toHaveLength(2);
      expect(plugins[0]).toBe(userPlugin); // prepended
      expect(plugins[1]).toBe(existingPlugin); // preserved
    });

    it('filters null/undefined entries when prepending to an existing plugins list', () => {
      const userPlugin: Rolldown.Plugin = { name: 'user' };
      const externalGlobals = () => userPlugin;

      const rolldownOptions: Rolldown.RolldownOptions = {
        external: () => true,
        output: { format: 'iife' },
        plugins: [null, undefined, { name: 'existing' }] as any
      };

      setOutputGlobals(rolldownOptions, () => undefined, { externalGlobals });

      const plugins = rolldownOptions.plugins as Rolldown.Plugin[];
      // null/undefined entries removed; user plugin prepended.
      // null/undefined 项被过滤掉；user plugin 在最前。
      expect(plugins).toHaveLength(2);
      expect(plugins[0]).toBe(userPlugin);
      expect((plugins[1] as any).name).toBe('existing');
    });
  });
});
