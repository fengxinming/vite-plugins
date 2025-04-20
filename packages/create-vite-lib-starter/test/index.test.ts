import { describe, expect, test, vi } from 'vitest';

import { isNil, noop } from '../src/index';

describe('Utils Functions', () => {
  describe('isNil', () => {
    test('returns true for null', () => {
      expect(isNil(null)).toBe(true);
    });

    test('returns true for undefined', () => {
      expect(isNil(undefined)).toBe(true);
    });

    test('returns false for non-nil values', () => {
      expect(isNil(0)).toBe(false);
      expect(isNil('')).toBe(false);
      expect(isNil({})).toBe(false);
      expect(isNil(false)).toBe(false);
    });
  });

  describe('noop', () => {
    test('does not throw an error when called', () => {
      expect(() => noop()).not.toThrow();
    });

    test('is a function', () => {
      expect(typeof noop).toBe('function');
    });

    // 如果需要验证无副作用（可选）
    test('has no side effects', () => {
      const spy = vi.fn();
      noop(spy); // 假设支持参数但不执行
      expect(spy).not.toHaveBeenCalled();
    });
  });
});
