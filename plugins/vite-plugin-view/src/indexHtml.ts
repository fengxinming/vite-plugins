import { existsSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import type { ServerResponse } from 'node:http';
import path, { sep } from 'node:path';

import type { Connect, PreviewServer, ResolvedConfig, ViteDevServer } from 'vite';
import { isFileLoadingAllowed, normalizePath, send } from 'vite';
import { cleanUrl, FS_PREFIX, fsPathFromId, isDevServer } from 'vp-runtime-helper';

import Engine from './Engine';
import { logger } from './logger';

/**
 * Shared record type for `.html` files emitted by the `delegate` strategy.
 * Matches `DelegateWrittenMap` in index.ts at the value level so the two can
 * be passed by reference without importing types back and forth.
 *
 * `delegate` 策略写入的 `.html` 文件记录的共享类型。
 * 与 index.ts 中的 `DelegateWrittenMap` 值结构完全一致，便于在两处
 * 通过引用传递，不需要互相 import 类型。
 */
type DelegateWrittenMap = Map<string, { htmlPath: string, bakPath: string | null }>;

/**
 * Idempotent guard for installing process-exit restore hooks.
 * Declared at module scope because only ONE listener per signal is needed
 * regardless of how many times `createIndexHtmlMiddleware` is invoked
 * (Vite HMR restarts can call it repeatedly within a single Node process).
 *
 * 安装进程退出还原钩子的幂等守卫。
 * 声明在模块作用域，因为无论 `createIndexHtmlMiddleware` 被调用多少次
 * （Vite HMR 重启在同一个 Node 进程中会反复调用它），
 * 每种信号只需要一个监听器。
 */
let exitHooksInstalled = false;

/**
 * True when `filePath` is inside `root` (including being exactly `root`).
 * Called in preview mode to reject directory-traversal requests such as
 * `../../etc/passwd`. Callers MUST pass `root` and `filePath` that are
 * already normalised via `normalizePath` so path separators are consistent
 * on every platform.
 *
 * 判断 `filePath` 是否在 `root` 目录下（含恰好等于 root 的情况）。
 * 在 preview 模式下用于拒绝 `../../etc/passwd` 这种目录穿越请求。
 * 调用方必须保证传入的 `root` 与 `filePath` 都经过 `normalizePath` 归一化，
 * 保证不同平台下路径分隔符语义一致。
 */
function isParentDirectory(root: string, filePath: string): boolean {
  const normalizedRoot = root.endsWith(sep) ? root : `${root}${sep}`;
  return filePath === root || filePath.startsWith(normalizedRoot);
}

/**
 * Filesystem-access guard used in dev mode. Returns a tri-state result that
 * covers all possible filesystem states for the target path:
 *
 *   - 'allowed'  → path passes the server.fs allowlist; proceed normally
 *   - 'denied'   → a real file exists on disk at that path AND server.fs
 *                  disallows reading it; respond with 403 Forbidden
 *   - 'fallback' → no file exists on disk at that path yet; call next() so
 *                  downstream middlewares can handle the request as usual
 *
 * dev 模式下的文件系统访问守卫。返回三态结果，覆盖目标路径所有可能的
 * 文件系统状态：
 *
 *   - 'allowed'  → 通过 server.fs 白名单，正常继续
 *   - 'denied'   → 路径下确实存在磁盘文件，且 server.fs 配置禁止读取；
 *                  返回 403 Forbidden
 *   - 'fallback' → 路径下不存在磁盘文件；调用 next() 交由下游中间件
 *                  按常规处理
 */
function checkLoadingAccess(
  config: ResolvedConfig,
  filePath: string,
): 'allowed' | 'denied' | 'fallback' {
  if (isFileLoadingAllowed(config, filePath)) {
    return 'allowed';
  }
  if (existsSync(filePath)) {
    return 'denied';
  }
  return 'fallback';
}

/**
 * Emit a minimal 403 Forbidden response (used when the filesystem access
 * guard rejects a path). We intentionally do not leak the on-disk path back
 * to the client.
 *
 * 返回 403 Forbidden 响应（文件系统访问守卫拒绝时使用）。
 * 不向客户端泄漏磁盘路径。
 */
function respondWithAccessDenied(
  res: ServerResponse,
  server: ViteDevServer | PreviewServer,
): void {
  const isDev = isDevServer(server);
  const headers = isDev
    ? server.config.server.headers
    : server.config.preview.headers;
  if (headers) {
    for (const [k, v] of Object.entries(headers)) {
      if (v !== undefined && v !== null) {
        res.setHeader(k, v);
      }
    }
  }
  res.statusCode = 403;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end('403 Forbidden');
}

/**
 * Render a template file and return its HTML string.
 *
 * Calls `engine.render` and logs the mapping between the incoming request
 * and the resolved template file for debugging purposes.
 *
 * @param engine       — the template Engine instance
 * @param templatePath — absolute path to the template file (e.g. `/root/home.ejs`)
 * @param method       — HTTP method string, used for debug logging only
 * @param url          — incoming request URL, used for debug logging only
 * @returns the rendered HTML string
 *
 * 渲染模板文件并返回 HTML 字符串。
 *
 * 调用 `engine.render`，并记录请求与解析到的模板文件的对应关系，用于 debug。
 *
 * @param engine       — 模板 Engine 实例
 * @param templatePath — 模板文件绝对路径（如 `/root/home.ejs`）
 * @param method       — HTTP 方法字符串，仅用于 debug 日志
 * @param url          — 请求 URL，仅用于 debug 日志
 * @returns 渲染后的 HTML 字符串
 */
export async function renderTemplateHtml(
  engine: Engine,
  templatePath: string,
  method: string,
  url: string | undefined
): Promise<string> {
  logger.debug(`${method} "${url}" -> "${templatePath}" (template)`);
  return engine.render(templatePath);
}

/**
 * Write rendered HTML to disk, backing up a pre-existing `.html` file first.
 *
 * Flow:
 *   1. If `htmlPath` already exists on disk → rename it to
 *      `htmlPath.bak_<timestamp>` (timestamp suffix guarantees uniqueness, so
 *      a pre-existing `.bak_*` file is never overwritten).
 *   2. Write `html` contents to `htmlPath` SYNCHRONOUSLY so the file is
 *      guaranteed to exist before we `next()` to Vite's htmlFallbackMiddleware
 *      (which performs an `existsSync` check before rewriting the URL).
 *   3. Record the mapping in the caller-supplied `delegateWritten` map so
 *      `restoreBackedUpFiles` can undo the writes on process exit.
 *
 * Caller MUST ensure `delegateWritten.has(url)` returns false BEFORE calling
 * this function. This function intentionally skips the re-check because the
 * caller already holds the dedup guard (e.g. `if (delegateWritten.has(url)) return next()`).
 *
 * 将渲染后的 HTML 写入磁盘，若目标 `.html` 已存在则先备份。
 *
 * 流程：
 *   1. 如果 `htmlPath` 已在磁盘上存在 → 重命名为
 *      `htmlPath.bak_<时间戳>`（时间戳后缀保证唯一性，永远不会覆盖已有的
 *      `.bak_*` 备份文件）。
 *   2. **同步**写入 `html` 内容到 `htmlPath`，保证文件一定写入完成后才
 *      `next()` 到 Vite 的 htmlFallbackMiddleware（后者会在改写 URL 前做
 *      `existsSync` 检查）。
 *   3. 写入映射到调用方传入的 `delegateWritten` Map 中，供 `restoreBackedUpFiles`
 *      在进程结束时撤销写入。
 *
 * 调用方 **必须** 在调用前确保 `delegateWritten.has(url)` 返回 false。
 * 本函数刻意不做二次检查，因为调用方已经持有了去重守卫
 * （如 `if (delegateWritten.has(url)) return next()`）。
 */
export function emitHtmlFile(
  url: string,
  htmlPath: string,
  html: string,
  delegateWritten: DelegateWrittenMap,
): void {
  let bakPath: string | null = null;
  delegateWritten.set(url, { htmlPath, bakPath });

  if (existsSync(htmlPath)) {
    bakPath = `${htmlPath}.bak_${Date.now()}`;
    renameSync(htmlPath, bakPath);
    delegateWritten.get(url)!.bakPath = bakPath;
  }

  writeFileSync(htmlPath, html, 'utf-8');
}

/**
 * Undo the writes performed by `emitHtmlFile`: delete emitted `.html` files
 * and restore any `.bak_<timestamp>` backups to their original names.
 *
 * Must use SYNC APIs (`unlinkSync` / `renameSync`) because it is registered
 * on the Node `process` exit event loop which does not drain pending async
 * work.
 *
 * Idempotent: entries are deleted from `delegateWritten` as they are
 * processed, so calling it twice is safe — the second call becomes a no-op.
 *
 * 撤销 `emitHtmlFile` 执行的写入：删除写入的 `.html` 文件，
 * 并将任何 `.bak_<时间戳>` 备份还原为原文件名。
 *
 * 必须使用 **同步** API（`unlinkSync` / `renameSync`），因为它注册在 Node
 * `process` 的退出事件回调中，此时 Node 不再等待异步 IO 完成。
 *
 * 幂等：在处理过程中会同步删除 `delegateWritten` 中的条目，
 * 因此重复调用是安全的——第二次调用实际上是 no-op。
 */
export function restoreBackedUpFiles(
  delegateWritten: DelegateWrittenMap
): void {
  for (const [, { htmlPath, bakPath }] of delegateWritten) {
    try {
      unlinkSync(htmlPath);
    }
    catch { /* ignore */ }
    if (bakPath) {
      try {
        renameSync(bakPath, htmlPath);
      }
      catch { /* ignore */ }
    }
  }
  delegateWritten.clear();
}

/**
 * Install process-exit restore hooks ONCE per process (guarded by module-scope
 * `exitHooksInstalled` flag for idempotency). Covers:
 *   - `SIGINT`  (Ctrl+C)
 *   - `SIGTERM` (kill / orchestrator stop)
 *   - `uncaughtException` (synchronous JS crash)
 *   - `unhandledRejection` (Promise rejection without catch)
 * Each handler calls `restoreBackedUpFiles` before re-raising / terminating.
 *
 * `SIGKILL` is intentionally NOT covered — it cannot be caught. Leftover
 * `.bak_*` files can be manually cleaned or will be left untouched by the
 * timestamp suffix naming rule on the next run.
 *
 * 每个进程只注册一次进程退出还原钩子（由模块级 `exitHooksInstalled`
 * 标志位保证幂等）。覆盖：
 *   - `SIGINT`  (Ctrl+C)
 *   - `SIGTERM` (kill / 编排系统关停)
 *   - `uncaughtException` (同步 JS 崩溃)
 *   - `unhandledRejection` (未被 catch 的 Promise rejection)
 * 每个处理程序都会在终止 / 重新抛出异常前调用 `restoreBackedUpFiles`。
 *
 * 刻意不覆盖 `SIGKILL`——该信号无法被捕获。残留的 `.bak_*` 文件可手动清理，
 * 或因时间戳后缀命名规则在下次运行时互不影响。
 */
function installExitHooks(delegateWritten: DelegateWrittenMap): void {
  if (exitHooksInstalled) {
    return;
  }
  exitHooksInstalled = true;

  const restore = () => restoreBackedUpFiles(delegateWritten);
  process.on('SIGINT', () => {
    restore();
    process.exit(130);
  });
  process.on('SIGTERM', () => {
    restore();
    process.exit(143);
  });
  process.on('uncaughtException', () => {
    restore();
    process.exit(1);
  });
  process.on('unhandledRejection', () => {
    restore();
    process.exit(1);
  });
}

/**
 * Build the index-html middleware function (without registering it). Exposed
 * for unit tests that want to invoke the middleware directly with synthetic
 * req/res/next triples.
 *
 * The middleware processes document requests and performs the following steps:
 *   1. Resolve the incoming URL to a target `.html` path inside the project root.
 *   2. Run the tri-state server.fs access check and decide between 403,
 *      fallback, or continue.
 *   3. Look up whether a template file (`.pug` / `.ejs` / …) exists that
 *      matches the resolved target path.
 *   4. If a template matches:
 *        - When the `delegateWritten` Map is supplied → render the template to
 *          a sibling `.html` file on disk (creating a timestamped backup of any
 *          pre-existing `.html` at the same path), record the write entry in
 *          the Map, then call `next()` to continue down the middleware stack.
 *        - When `delegateWritten` is not supplied → render the template in
 *          memory, apply `transformIndexHtml` in dev mode, and send the HTML
 *          response directly to the client.
 *   5. If no template matches → call `next()` so downstream middlewares can
 *      handle the request normally.
 *
 * 构造 index-html 中间件函数（不注册）。导出给单测，方便用合成的
 * req/res/next 三元组直接调用。
 *
 * 中间件处理文档请求，按以下步骤执行：
 *   1. 将请求 URL 解析为项目根目录下的目标 `.html` 路径。
 *   2. 执行 server.fs 三态访问检查，决定返回 403、交给下游、或继续。
 *   3. 查找是否存在与解析后目标路径匹配的模板文件（`.pug` / `.ejs` 等）。
 *   4. 如果命中模板：
 *        - 传入了 `delegateWritten` Map → 将模板渲染为磁盘上同目录的
 *          `.html` 文件（若路径下已有 `.html` 则创建带时间戳的备份），
 *          将写入条目记录到 Map 中，然后调用 `next()` 继续沿中间件栈向下。
 *        - 未传入 `delegateWritten` → 在内存中渲染模板，dev 模式下应用
 *          `transformIndexHtml`，然后直接向客户端发送 HTML 响应。
 *   5. 如果未命中模板 → 调用 `next()`，交由下游中间件正常处理该请求。
 */
export function createIndexHtmlMiddleware(
  engine: Engine,
  root: string,
  server: ViteDevServer | PreviewServer,
  /**
   * When supplied, the middleware renders each matched template to a
   * sibling `.html` file on disk, records the write (and backup if created)
   * in the Map, and calls `next()` to proceed down the stack.
   * When omitted, the middleware renders templates in memory, applies
   * `transformIndexHtml` in dev mode, and sends the HTML response directly.
   *
   * 传入时，中间件将每个命中的模板渲染为磁盘上同目录的 `.html` 文件，
   * 将写入信息（以及创建的备份）记录到 Map 中，然后调用 `next()`
   * 沿中间件栈继续。
   * 不传时，中间件在内存中渲染模板，dev 模式下应用 `transformIndexHtml`，
   * 然后直接发送 HTML 响应。
   */
  delegateWritten?: DelegateWrittenMap,
): Connect.NextHandleFunction {
  const isDev = isDevServer(server);

  if (isDev) {
    const onChange = (file: string) => {
      if (file.endsWith(engine.extension)) {
        const broadcaster = server.hot || (server).ws;

        if (!broadcaster) {
          return;
        }

        broadcaster.send({
          type: 'full-reload',
          path: '*'
        });

        logger.info(`"${file}" has changed, reloading page...`);
      }
    };

    server.watcher.on('change', onChange);

    // Best-effort cleanup when the server shuts down so repeated
    // installIndexHtmlMiddleware calls don't accumulate listeners.
    const httpServer = server.httpServer;
    if (httpServer) {
      const cleanup = () => {
        server.watcher.off('change', onChange);
        httpServer.off('close', cleanup);
      };
      httpServer.once('close', cleanup);
    }

    // When running `delegate` strategy, install process-exit hooks once so
    // generated `.html` files are cleaned up and `.bak_*` files are restored
    // when the Node process terminates (SIGINT / SIGTERM / exceptions).
    // 以 `delegate` 策略运行时，只注册一次进程退出钩子，保证 Node 进程
    // 终止时（SIGINT / SIGTERM / 异常）清理生成的 `.html` 文件并还原
    // `.bak_*` 备份。
    if (delegateWritten) {
      installExitHooks(delegateWritten);
    }
  }

  const normalizedRoot = normalizePath(root);

  // Keep the named function. The name is visible in debug logs via `DEBUG=connect:dispatcher ...`
  return async function viteIndexHtmlMiddleware(req, res, next) {
    if (res.writableEnded) {
      return next();
    }

    // Request-kind pre-filter. Quick exits for requests that by definition
    // cannot be document renders:
    //   - Only GET / HEAD ever carry HTML documents; other methods (POST
    //     form submissions, API writes) must never be intercepted.
    //   - `/favicon.ico` is an automated browser probe that never renders HTML.
    //   - An explicit `Accept` header that asks for neither `text/html` nor
    //     the wildcard `*/*` means the caller expects JSON / image / binary
    //     payload — don't waste time matching templates.
    //
    // 请求类型前置过滤。快速退出明显不属于文档渲染的请求：
    //   - 只有 GET / HEAD 能返回 HTML 文档；POST 表单提交、API 写操作等
    //     请求必须不被拦截。
    //   - `/favicon.ico` 是浏览器自动发起的探测请求，不会是 HTML。
    //   - `Accept` 头明确不要求 `text/html` 也不含通配符 `*/*` 时，
    //     调用方期望的是 JSON / 图片 / 二进制，不需要花时间匹配模板。
    const method = (req.method || 'GET').toUpperCase();
    if (
      (method !== 'GET' && method !== 'HEAD')
      || req.url === '/favicon.ico'
    ) {
      return next();
    }
    const accept = req.headers.accept;
    if (
      accept !== undefined
      && accept !== ''
      && !accept.includes('text/html')
      && !accept.includes('*/*')
    ) {
      return next();
    }

    const url = req.url && cleanUrl(req.url);

    // Entry shape classification — document candidates are:
    //   • root `/` or empty path
    //   • explicit `.html` file requests
    //   • extensionless paths outside Vite's internal `/@...` namespace
    //     (dev virtual modules)
    // Requests marked with `sec-fetch-dest: script` are excluded so
    // script fetches never enter the template-rendering path.
    //
    // 入口分类 —— 候选文档请求包括：
    //   • 根路径 `/` 或空路径
    //   • 显式 `.html` 文件请求
    //   • Vite 内部 `/@...` 命名空间（dev 虚拟模块）之外的无扩展名路径
    // 标记为 `sec-fetch-dest: script` 的请求被排除，
    // 确保脚本获取不会进入模板渲染分支。
    const isHtmlShape
      = url === '/'
      || url === ''
      || !!url?.endsWith('.html')
      || (!!url && !url.includes('.') && !url.startsWith('/@'));
    if (!isHtmlShape || req.headers['sec-fetch-dest'] === 'script') {
      return next();
    }

    // Strip trailing slashes for non-root paths so `/home/` collapses to
    // `/home`. The downstream template lookup and file-path resolution use
    // the simplified path; `/index.html` equivalent behaviour is handled by
    // the path normalisation step below (root → index.html).
    // 去掉非根路径的尾部斜杠，把 `/home/` 归约成 `/home`。后续模板查找
    // 和文件路径解析使用简化后的路径；`/index.html` 等价行为由下面的
    // 路径归一化步骤（root → index.html）负责。
    const cleanUrlStr = url!.length > 1 && url!.endsWith('/')
      ? url!.slice(0, -1)
      : url!;

    // Turn the URL path into an on-disk absolute path inside project root.
    // Two input shapes are supported:
    //   - `FS_PREFIX` (Vite dev-time @fs/... URLs): decoded straight into an
    //     absolute path via `fsPathFromId`.
    //   - Normal URLs: joined against `root` then `path.resolve`d so `.` /
    //     `..` segments and symlinks are resolved consistently with Vite.
    // Decode failures (e.g. malformed percent-encoding like `/%ZZ`) are
    // handled by calling `next()` so the request continues down the stack;
    // the middleware never raises a 500 URIError to the client.
    //
    // 将 URL 路径转为项目根目录下的磁盘绝对路径。支持两种输入形态：
    //   - `FS_PREFIX`（Vite 开发态的 @fs/... URL）：通过 `fsPathFromId`
    //     直接解码为绝对路径。
    //   - 普通 URL：与 `root` 拼接后走 `path.resolve`，统一处理 `.` /
    //     `..` 段与符号链接。
    // 若 decode 失败（例如 `/%ZZ` 这种畸形百分号编码），直接调用 `next()`
    // 让请求继续沿栈向下；中间件永远不会向客户端抛出 500 URIError。
    let filePath: string;
    if (isDev && cleanUrlStr.startsWith(FS_PREFIX)) {
      try {
        filePath = decodeURIComponent(fsPathFromId(cleanUrlStr));
      }
      catch {
        return next();
      }
    }
    else {
      try {
        filePath = normalizePath(
          path.resolve(path.join(root, decodeURIComponent(cleanUrlStr)))
        );
      }
      catch {
        return next();
      }
    }

    // Normalise the target path to a `.html` name before template lookup so
    // the template engine can match `.ejs` / `.pug` files by the HTML basename.
    // Mapping:
    //   - root path (project root itself) → `index.html`
    //   - extensionless `/home`              → `home.html`
    //   - already suffixed `/home.html`      → passed through unchanged
    //
    // 模板查找前先把目标路径归一化成 `.html` 名称，模板引擎就能按 HTML
    // 基名匹配 `.ejs` / `.pug` 文件。
    // 映射：
    //   - 根路径（项目根本身）→ `index.html`
    //   - 无扩展名 `/home`       → `home.html`
    //   - 已带后缀 `/home.html`  → 不变透传
    if (
      filePath === normalizedRoot
      || filePath === `${normalizedRoot}/`
    ) {
      filePath = normalizePath(path.join(root, 'index.html'));
    }
    else if (!filePath.endsWith('.html')) {
      filePath += '.html';
    }

    // Security gate before touching disk:
    //   - Dev mode → tri-state server.fs guard; returns 403 only when the
    //     target file actually exists on disk AND is disallowed. If the file
    //     doesn't exist yet we `next()` — the request might be a valid API
    //     route, a Vite internal virtual module, etc.
    //   - Preview mode → plain directory-inclusion check. Any path that
    //     escapes `root` is handed to next() (which typically 404s).
    //
    // 碰磁盘前的安全闸门：
    //   - Dev 模式 → 三态 server.fs 守卫；只在目标文件**确实在磁盘上存在**
    //     且被禁止访问时才 403。文件不存在时就 `next()`——请求可能是合法
    //     API 路由、Vite 内部虚拟模块等。
    //   - Preview 模式 → 简单目录包含校验。任何逃出 `root` 范围的路径
    //     都交给 next()（通常最后 404）。
    if (isDev) {
      const servingAccessResult = checkLoadingAccess(server.config, filePath);
      if (servingAccessResult === 'denied') {
        return respondWithAccessDenied(res, server);
      }
      if (servingAccessResult === 'fallback') {
        return next();
      }
    }
    else if (!isParentDirectory(normalizedRoot, filePath)) {
      return next();
    }

    // delegate 策略下，若该 URL 在当前进程生命周期内已写入过磁盘，
    // 直接跳过模板渲染和磁盘写入，交由下游流水线处理已存在的文件。
    // Under the delegate strategy, if the URL has already been written
    // to disk during this process lifetime, skip template rendering and
    // disk write — let the downstream pipeline handle the existing file.
    if (delegateWritten && delegateWritten.has(cleanUrlStr)) {
      return next();
    }

    // Look for a template file alongside the target `.html` location. The
    // template uses the engine's configured extension (for example `.ejs` or
    // `.pug`) while sharing the same basename as the target `.html`. If no
    // such template exists, call `next()` to proceed down the middleware stack.
    //
    // 在目标 `.html` 路径的同目录下查找模板文件。模板文件与目标 `.html`
    // 共享同一基名，扩展名使用引擎配置的值（如 `.ejs` / `.pug`）。
    // 若未找到对应模板，调用 `next()` 继续沿中间件栈向下。
    const templatePath = engine.getTemplate(filePath);
    if (!templatePath) {
      return next();
    }

    const reqMethod = (req.method || 'GET').toUpperCase();

    // Render the template to an HTML string. Both delivery paths begin
    // with the same render step.
    // 将模板渲染为 HTML 字符串。两个分发路径都从同一个渲染步骤开始。
    let html = '';
    try {
      html = await renderTemplateHtml(engine, templatePath, reqMethod, req.url);
    }
    catch (e) {
      return next(e);
    }

    if (isDev) {
      server.watcher.add(templatePath);
    }

    if (delegateWritten) {
      // Write the rendered HTML to disk. The URL dedup guard above
      // guarantees this is the first write for this URL in this process.
      // 将渲染后的 HTML 写入磁盘。上方的 URL 去重守卫保证当前进程
      // 生命周期内这是该 URL 的首次写入。
      emitHtmlFile(cleanUrlStr, filePath, html, delegateWritten);
      return next();
    }

    let headers;
    let finalHtml = html;
    if (isDev) {
      headers = server.config.server.headers;

      // No `delegateWritten` Map was supplied. Send the rendered HTML
      // directly to the client. In dev mode apply `transformIndexHtml`
      // before sending so the dev client script and user HTML hooks run.
      // 调用方未提供 `delegateWritten` Map。将渲染后的 HTML 直接发送给客户端。
      // Dev 模式下在发送前应用 `transformIndexHtml`，以运行 dev client 脚本
      // 注入和用户自定义 HTML hook。
      try {
        finalHtml = await server.transformIndexHtml(cleanUrlStr, finalHtml, req.originalUrl);
      }
      catch (e) {
        return next(e);
      }
    }
    else {
      headers = server.config.preview.headers;
    }
    return send(req, res, finalHtml, 'html', { headers });
  };
}

/**
 * Register the index-html middleware at the front of the middleware stack.
 * The middleware inspects each incoming request URL and renders the
 * matching template (if any) before any SPA-rewrite logic can alter the
 * path. When no template matches, the request passes untouched to the
 * rest of the stack.
 *
 * 将 index-html 中间件注册到中间件栈的最前端。中间件在任何 SPA 重写逻辑
 * 修改路径之前，先检查每一个入站请求 URL 并渲染匹配的模板（若存在）。
 * 未命中模板时，请求原样透传给栈的其余部分继续处理。
 */
export function installIndexHtmlMiddleware(
  engine: Engine,
  root: string,
  server: ViteDevServer | PreviewServer,
  /**
   * Pass a writable Map to write rendered templates to disk and record each
   * operation. Pass `undefined` (or omit) to render in memory and send
   * responses directly. See `createIndexHtmlMiddleware` parameter docstring
   * for the complete behavior description.
   *
   * 传入可写的 Map 时，将渲染后的模板写入磁盘并记录每次操作；
   * 传 `undefined`（或不传）则在内存中渲染并直接发送响应。
   * 完整行为说明参见 `createIndexHtmlMiddleware` 的参数文档。
   */
  delegateWritten?: DelegateWrittenMap,
): void {
  const middleware = createIndexHtmlMiddleware(engine, root, server, delegateWritten);
  // PREPEND to the middleware stack so we run before spaFallbackMiddleware.
  // unshift 到中间件栈最顶端，保证在 spaFallbackMiddleware 之前跑。
  (server.middlewares as any).stack.unshift({ route: '', handle: middleware });
}
