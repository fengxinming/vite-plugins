import { type ChildProcess, spawn } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

export interface DevHandle {
  proc: ChildProcess;
  baseUrl: string;
  close: () => Promise<void>;
}

/** `runBuild` 的结果：子进程退出码 + 合并后的 stdout/stderr 输出。 */
export interface BuildResult {
  code: number | null;
  stdout: string;
}

/**
 * 匹配 ANSI SGR 颜色/样式转义码，如 `ESC[1m`、`ESC[22m`、`ESC[36m`。
 * 用 `String.fromCharCode(27)` 拼出 ESC，避免正则字面量里出现控制符
 * （那会被 eslint `no-control-regex` 拦截）。
 */
const ANSI_SGR = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');

/**
 * 等待 vite 打印 `Local: <url>` banner，解析出 baseUrl（去掉尾部 `/`）。
 *
 * 坑：vite 8 的 banner 带 ANSI 颜色码，且颜色码会**切断关键字** ——
 * `Local` 实为 `\x1b[1mLocal\x1b[22m:`，端口号也形如
 * `http://127.0.0.1:\x1b[1m5189\x1b[22m/`。若直接匹配字面量 `Local:`，
 * 转义码插在中间会导致正则永远失配。因此必须先把 ANSI 转义码剥干净，
 * 再提取 URL。
 */
function waitReady(proc: ChildProcess): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const onData = (buf: Buffer) => {
      chunks.push(buf);
      const text = Buffer.concat(chunks).toString('utf-8').replace(ANSI_SGR, '');
      const m = /Local:\s*(https?:\/\/\S+)/.exec(text);
      if (m) {
        resolve(m[1].replace(/\/+$/, ''));
      }
    };
    proc.stdout?.on('data', onData);
    proc.stderr?.on('data', onData);
    proc.on('error', reject);
    proc.on('exit', (code) => {
      reject(new Error(`dev server exited before ready (code=${code})`));
    });
    setTimeout(() => reject(new Error('dev server did not become ready in time')), 60000);
  });
}

async function killTree(proc: ChildProcess): Promise<void> {
  const pid = proc.pid;
  if (pid == null) {
    return;
  }
  // 直接 SIGKILL 整个进程组。不发 SIGTERM —— 部分插件（如 view 的 delegate
  // 策略）注册了 process.on('SIGTERM') 退出钩子做磁盘回滚，会和测试自身的
  // manualCleanup 冲突导致 .html/.bak_ 残留。SIGKILL 不可捕获，收尾完全交给
  // 测试自己的清理逻辑（等价于原 createServer().close()）。
  try {
    process.kill(-pid, 'SIGKILL');
  }
  catch {
    try {
      proc.kill('SIGKILL');
    }
    catch {
      // 已经退出
    }
  }
  await new Promise<void>((res) => {
    const t = setTimeout(res, 1000);
    proc.on('exit', () => {
      clearTimeout(t);
      res();
    });
  });
}

/**
 * 以子进程方式启动 example 的 dev server，等价于在终端敲 `pnpm run <cmd>:<n>`
 * （n 省略时直接 `<cmd>`）。等待 vite 打印 `Local: <url>` banner 后解析出
 * baseUrl 返回。dev server 的生命周期由调用方在 afterAll 里调用 close() 收尾。
 *
 * 之所以走子进程（而非 vite 的 createServer API）：让测试用的 dev server
 * 启动方式与用户真实用法完全一致，并且每个脚本可在 package.json 里固定不同
 * 端口，避免并发时抢同一个 5173 互相干扰。
 */
export async function runScript(root: string, cmd: string, n?: number): Promise<DevHandle> {
  const script = n == null ? cmd : `${cmd}:${n}`;
  const proc = spawn('pnpm', ['run', script], {
    cwd: root,
    detached: true,
    env: { ...process.env, FORCE_COLOR: '0' },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  const baseUrl = await waitReady(proc);

  return {
    proc,
    baseUrl,
    close: () => killTree(proc)
  };
}

/**
 * 以子进程方式跑 example 的 build 脚本，等价于终端敲 `pnpm run build:<n>`。
 * 等待进程自然退出后返回退出码与合并输出。
 *
 * 与 dev 一样走子进程（而非进程内 `build()` API），让构建方式
 * 与用户真实用法保持一致；失败时 stdout 会带回 vite 的报错信息，
 * 便于断言时定位。
 */
export function runBuild(root: string, cmd = 'build', n?: number): Promise<BuildResult> {
  const script = n == null ? cmd : `${cmd}:${n}`;
  return new Promise<BuildResult>((res, reject) => {
    const proc = spawn('pnpm', ['run', script], {
      cwd: root,
      detached: true,
      env: { ...process.env, FORCE_COLOR: '0' },
      stdio: ['ignore', 'pipe', 'pipe']
    });
    const chunks: Buffer[] = [];
    const onData = (buf: Buffer) => {
      chunks.push(buf);
    };
    proc.stdout?.on('data', onData);
    proc.stderr?.on('data', onData);
    proc.on('error', reject);
    proc.on('exit', (code) => {
      res({ code, stdout: Buffer.concat(chunks).toString('utf-8') });
    });
    const timer = setTimeout(() => {
      void killTree(proc).then(() => reject(new Error(`build script "${script}" timed out`)));
    }, 180000);
    proc.on('exit', () => {
      clearTimeout(timer);
    });
  });
}

/**
 * 删除 root 下的某个目录（不存在则跳过）。所有产物清理的底层实现。
 */
export function cleanDir(root: string, rel: string): void {
  const target = resolve(root, rel);
  if (existsSync(target)) {
    rmSync(target, { recursive: true, force: true });
  }
}

/**
 * 统一清理构建产物目录。默认清 `<root>/dist`；
 * 传 `sub` 时只清 `<root>/dist/<sub>`（用于各 config 输出到独立子目录的
 * example）。供所有 build 测试的 afterEach 调用，替换各自手写的 rmSync。
 */
export function cleanDist(root: string, sub?: string): void {
  cleanDir(root, sub == null ? 'dist' : `dist/${sub}`);
}
