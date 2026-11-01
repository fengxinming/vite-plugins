import type { Rolldown } from 'vite';
import { describe, expect, it } from 'vitest';

import { setOutputGlobals } from '../../src/lib/handleGlobals';

describe('lib/handleGlobals', () => {
  describe('setOutputGlobals', () => {
    it('installs a function-shape output.globals that asks the globalObject table first', () => {
      const rolldownOptions: Rolldown.RolldownOptions = {
        output: { format: 'iife' }
      };
      // 模拟 resolveHook 在解析命中后登记的映射表：react → React、vue → Vue。
      const globalObject: Record<string, string> = { react: 'React', vue: 'Vue' };

      setOutputGlobals(rolldownOptions, globalObject);

      const output = rolldownOptions.output as Rolldown.OutputOptions;
      const globals = output.globals as (id: string) => string;

      expect(typeof globals).toBe('function');
      expect(globals('react')).toBe('React');
      expect(globals('vue')).toBe('Vue');
    });

    it('falls back to the original function-shape output.globals for unmapped libs', () => {
      const originalGlobals = (id: string) => `__${id}`;
      const rolldownOptions: Rolldown.RolldownOptions = {
        output: { format: 'iife', globals: originalGlobals }
      };
      const globalObject: Record<string, string> = { react: 'React' };

      setOutputGlobals(rolldownOptions, globalObject);

      const output = rolldownOptions.output as Rolldown.OutputOptions;
      const globals = output.globals as (id: string) => string;

      // react has a string mapping in the table → plugin wins.
      // react 在表里有 string 映射 → 插件声明优先。
      expect(globals('react')).toBe('React');
      // lodash is NOT mapped → fall back to user's original function.
      // lodash 没映射 → 兜底到用户的原始函数。
      expect(globals('lodash')).toBe('__lodash');
    });

    it('falls back to the original object-shape output.globals for unmapped libs', () => {
      const rolldownOptions: Rolldown.RolldownOptions = {
        output: {
          format: 'iife',
          globals: { lodash: '_' }
        }
      };
      const globalObject: Record<string, string> = { react: 'React' };

      setOutputGlobals(rolldownOptions, globalObject);

      const output = rolldownOptions.output as Rolldown.OutputOptions;
      const globals = output.globals as (id: string) => string;

      expect(globals('react')).toBe('React');
      expect(globals('lodash')).toBe('_');
    });

    it('treats pure externals (no table entry) as "no global name" and falls back', () => {
      // 纯 external（resolveHook 返回 true）不会向 globalObject 登记全局名；
      // 插件要兜底用用户的 output.globals 拿名字。
      const rolldownOptions: Rolldown.RolldownOptions = {
        output: { format: 'iife', globals: { lodash: '_' } }
      };
      const globalObject: Record<string, string> = {};

      setOutputGlobals(rolldownOptions, globalObject);

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
      const globalObject: Record<string, string> = { react: 'React' };

      setOutputGlobals(rolldownOptions, globalObject);

      const outputs = rolldownOptions.output as Rolldown.OutputOptions[];
      expect(Array.isArray(outputs)).toBe(true);
      expect(typeof outputs[0].globals).toBe('function');
      expect(typeof outputs[1].globals).toBe('function');
      expect((outputs[0].globals as (id: string) => string)('react')).toBe('React');
      expect((outputs[1].globals as (id: string) => string)('react')).toBe('React');
    });
  });
});
