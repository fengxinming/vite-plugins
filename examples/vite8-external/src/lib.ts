/**
 * Node 库入口示例 — 配合 nodeBuiltins + externalizeDeps 使用
 * 故意引入 lodash、dayjs、@babel/core 以便 externalizeDeps 能真正生效，
 * 而不是只写在配置里但源代码从不引用。
 */
import { join } from 'node:path';

import * as babel from '@babel/core';
import dayjs from 'dayjs';
import _ from 'lodash';

export function resolvePath(base: string, ...segments: string[]): string {
  return join(base, ...segments);
}

export function greet(name: string): string {
  return `Hello, ${name}!`;
}

/**
 * 使用 lodash 的 merge / pick — 确保 lodash 被真实引用，
 * 这样 externalizeDeps: ['lodash'] 才不是空配置。
 */
export function mergeUser<T extends object>(base: T, extra: Partial<T>): T {
  return _.merge({}, base, extra);
}

export function pickUserFields<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  return _.pick(obj, keys);
}

/**
 * 使用 dayjs 格式化日期 — 验证 dayjs 被真实引用，
 * 使 externalizeDeps: ['dayjs'] 生效。
 */
export function formatDate(date: Date | string | number, pattern = 'YYYY-MM-DD'): string {
  return dayjs(date).format(pattern);
}

/**
 * 使用 @babel/core 的 version 字段 — 验证 @babel/* 被真实引用，
 * 使 externalizeDeps: [/^@babel\//] 和 externals: [/^@babel\//] 生效。
 */
export function getBabelVersion(): string {
  return (babel as any).version || 'unknown';
}
