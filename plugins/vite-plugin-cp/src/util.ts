/*
 * vite-plugin-cp/util — 文件复制相关的工具函数
 * vite-plugin-cp/util — File copy utility functions
 *
 * 模块职责 / Module responsibilities:
 *   - stringify: 任意值的日志友好序列化（用于日志输出配置对象等）
 *   - changeName: 按 rename 策略计算目标文件名
 *   - makeCopy:   根据是否提供 transform，返回"纯复制"或"读取-转换-写入"两种复制函数
 *
 * makeCopy 设计选择 / Why makeCopy wraps fs-extra.copy:
 *   - 无 transform 时直接返回 fs-extra.copy（走流式拷贝，性能最佳、支持目录递归）
 *     Without transform, return fs-extra.copy directly (streamed, performant, recursive dirs).
 *   - 有 transform 时不能流式修改，需整文件读入内存 → transform → outputFile 写出；
 *     同时 outputFile 会自动创建不存在的目标目录，与 copy 行为保持一致。
 *     With transform, streaming is not possible; we read the whole file into memory,
 *     run transform, then outputFile writes. outputFile auto-creates missing dirs like copy.
 */
import { readFile } from 'node:fs/promises';
import { inspect } from 'node:util';

import { copy, outputFile } from 'fs-extra';

import { TransformFile } from './typings';

/*
 * stringify — 将任意值序列化为单行字符串（用于日志打印配置对象、错误信息等）
 * stringify — Serializes any value to a single-line string (for logging configs, errors, etc.)
 *
 * @param value 任意要序列化的值
 *              Any value to serialize
 * @returns     breakLength=Infinity 的 util.inspect 结果（保证单行输出）
 *              util.inspect output with breakLength=Infinity (ensures single-line output)
 */
export function stringify(value: any): string {
  return inspect(value, { breakLength: Infinity });
}

/*
 * changeName — 根据 rename 策略计算目标文件名
 * changeName — Computes destination file name using the rename strategy
 *
 * @param name   原始文件名（如 'foo.txt'）
 *               Original file name (e.g. 'foo.txt')
 * @param rename 重命名策略：
 *                 - undefined/null: 返回原 name
 *                 - 字符串:         直接替换
 *                 - 函数:           以 name 为参数调用，返回值 falsy 则回退原 name
 *               Rename strategy:
 *                 - undefined/null: returns original name
 *                 - string:         direct replacement
 *                 - function:       called with name; if result is falsy, falls back to original
 */
export function changeName(name: string, rename?: string | ((str: string) => string)) {
  if (typeof rename === 'function') {
    return rename(name) || name;
  }
  return rename || name;
}

/*
 * makeCopy — 生成一个复制函数：按是否提供 transform 选择实现
 * makeCopy — Produces a copy function; picks implementation based on whether a transform is given
 *
 * @param transform 可选的文件内容转换函数：(Buffer, fromPath) => string | Buffer
 *                  Optional file content transformer: (Buffer, fromPath) => string | Buffer
 *
 * @returns 一个 (from, to) => Promise<void> 的复制函数：
 *            - transform 为空：返回 fs-extra 的 copy 函数（高性能、支持目录）
 *            - transform 存在：返回自定义函数，readFile → transform → outputFile
 *          A copy function (from, to) => Promise<void>:
 *            - no transform: returns fs-extra copy (fast, supports directories)
 *            - has transform: custom fn: readFile → transform → outputFile
 *
 * 为什么不直接 if/else 在调用处判断？ / Why not inline the if/else at call sites:
 *   把"策略选择"收敛在此处，上层插件只关心 (from, to) 的统一接口，
 *   每次复制无需再次判断 transform 是否存在。
 *   Strategy selection is encapsulated here; upper layers use a uniform (from, to) API
 *   and don't re-check transform on every single copy call.
 */
export function makeCopy(transform?: TransformFile) {
  return typeof transform === 'function'
    ? function (from: string, to: string) {
      return readFile(from)
        .then((buf: Buffer) => transform(buf, from))
        .then((data: string | Buffer) => {
          return outputFile(to, data as any);
        });
    }
    : copy;
}
