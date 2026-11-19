import { createMockAdapter } from 'vite-plugin-mock-data/axios-adapter';
import { mockRoutes } from 'vite-plugin-mock-data/mock-client';
import { describe, expect, it } from 'vitest';

/**
 * `mockIn: false` 关闭态（config 12）。
 *
 * 门控 `mockIn === 'client' || command === mockIn` 对 false 恒不成立，
 * 故 serve 下 virtual:mock-routes 只下发空路由表（即使 routes: './mock' 配着）。
 * 本套件以 `vitest --config vite.config.12.mts` 运行，走与产物一致的静态导入链：
 *   axios-adapter → mock-client → virtual:mock-routes（空表）。
 *
 * 直接断言关闭态的两个可观测结果，而不是发请求看失败：
 *   - mockRoutes 为空 → 虚拟模块确实没下发路由；
 *   - createMockAdapter() 为 undefined → 空表时不造 adapter（axios 会回落默认 adapter）。
 */
describe('mockIn: false disables client mock (config 12)', () => {
  it('virtual:mock-routes 下发空路由表', () => {
    expect(mockRoutes).toHaveLength(0);
  });

  it('空路由表时 createMockAdapter() 返回 undefined', () => {
    expect(createMockAdapter()).toBeUndefined();
  });
});
