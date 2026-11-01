/*
 * vite-plugin-combine — 把一组源文件组合成一个统一入口，并接入 Vite 构建
 * vite-plugin-combine — Combines a set of source files into one entry for Vite builds
 *
 * 整体流程 / Overall flow:
 *   1. 解析 cwd、target，glob 出源文件列表（排序 + 排除 target 自身与 .d.ts）
 *   2. config 钩子：
 *        - 渲染组合代码并写入 target（磁盘上真实文件）
 *        - lib 模式：合并进 build.lib.entry
 *        - app 模式：作为额外 input 追加，并显式保留 index.html
 *   3. configResolved：记录 outDir / 是否 lib 模式；watch + dts 时告警
 *   4. buildStart：幂等补写 target（watch 每轮重建时自愈）
 *   5. closeBundle：lib 模式下让声明扩展名与产物配对，然后删除 target
 *
 * 为什么必须落盘 / Why a real file on disk:
 *   Vite / Rolldown 的 entry 必须是磁盘上真实存在的路径，虚拟模块无法作为构建入口；
 *   而 vite-plugin-dts 只分析真实文件，所以组合代码必须写入 target。
 *   Vite/Rolldown entries must be real on-disk paths, and vite-plugin-dts only analyses real
 *   files, so the combined code has to be written to `target`.
 *
 * 为什么配了 dts 时 watch 不可信 / Why watch is unreliable with dts:
 *   vite-plugin-dts 只在首轮构建生成声明，之后改源文件不会重新产出 .d.ts
 *   （实测：把返回类型从 string 改成接口，产物声明仍是旧签名）。
 *   vite-plugin-dts only emits declarations on the first build; later source edits are not
 *   reflected (verified: changing a return type left the emitted declaration stale).
 */
import { existsSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { parse, resolve } from 'node:path';

import { globSync } from 'tinyglobby';
import type { Plugin } from 'vite';
import type { PluginOptions as DtsPluginOptions } from 'vite-plugin-dts';
import dts from 'vite-plugin-dts';
import { banner, toAbsolutePath } from 'vp-runtime-helper';

import { appendEntry, makeESModuleCode, rebuildInput, syncDeclarations } from './common';
import { logger, PLUGIN_NAME } from './logger';
import type { Options } from './types';

/*
 * 自动生成标记 — 写在 target 首行
 * Auto-generation marker — written as the target's first line
 *
 * 它的唯一作用是让 writeTarget 能区分「自己上次生成的残留」和「用户自己写的同名文件」。
 * 构建被 SIGKILL 强杀时退出钩子也拦不住，残留会留在源码目录；有标记就可以安全覆盖，
 * 没有标记才中断构建。它也顺便告诉用户这个文件不要手改。
 * Its only job: let writeTarget tell its own leftovers apart from user-owned files, so a
 * SIGKILLed build self-heals instead of blocking the next one.
 */
const GENERATED_MARKER = `/* ${PLUGIN_NAME}: auto-generated, do not edit */`;
export * from './types';

export default function pluginCombine(opts: Options): Plugin | Plugin[] | undefined {
  if (!opts) {
    opts = {} as Options;
  }

  if (opts.enableBanner) {
    banner(PLUGIN_NAME);
  }

  const { src, logLevel } = opts;
  if (logLevel) {
    logger.level = logLevel;
  }

  const cwd = opts.cwd || process.cwd();

  /*
   * 默认值必须是 .ts：vite-plugin-dts 只对 TypeScript 源文件产声明，
   * 默认成 .js 会出现"开了 dts 却拿不到入口声明"，而且不报错。
   * The default must be a .ts path: vite-plugin-dts only emits declarations for TypeScript
   * sources, so a .js default silently yields no entry declaration even with dts enabled.
   */
  const target = opts.target || 'index.ts';
  const absTarget = toAbsolutePath(target, cwd);
  const targetStem = parse(absTarget).name;

  /*
   * 排序 + 过滤，保证同一份配置每次产出的顺序一致：
   *   - sort():         glob 底层顺序不稳定，会让产物 hash 与 diff 抖动
   *   - 排除 absTarget: target 由本插件生成，若被 glob 命中会指向自己
   */
  const files = globSync(src, { cwd, absolute: true, ignore: [absTarget, '**/*.d.ts'] });

  if (!files.length) {
    logger.warn(`No files found in '${src}'.`);
    return;
  }

  logger.debug(`Found ${files.length} files in '${src}':`, files);

  /*
   * 组合代码只渲染一次
   * The combined code is rendered exactly once
   *
   * config 在多环境构建、配置热重载等场景下可能被多次调用，而 beforeWrite 是用户提供的
   * 任意函数，可能带副作用（时间戳、计数器）。重复渲染会让两次文本不同，
   * 进而被 writeTarget 的"内容不一致即冲突"判断误判成第三方文件。
   * `config` can run more than once (multi-environment builds, config reloads), while
   * beforeWrite is an arbitrary user function that may carry side effects. Re-rendering would
   * yield different text and be misread as a third-party file conflict.
   */
  let renderedCode: string | undefined;

  function renderCode(): string {
    if (renderedCode === undefined) {
      renderedCode = `${GENERATED_MARKER}\n${makeESModuleCode(files, absTarget, opts)}`;
    }
    return renderedCode;
  }

  /*
   * 进程退出清理 — 写入 target 后绑定，删除 target 后解绑
   * Exit cleanup — bound after writing the target, unbound after removing it
   *
   * 为什么需要：构建被 Ctrl+C / SIGTERM 中断时 closeBundle 不会执行，target 会残留在
   * 源码目录里；下一次构建读到它（内容与本次不同）会被误判成"用户文件"并中断。
   * 这里监听进程退出，在退出前同步删掉。
   * Why: an interrupted build never reaches closeBundle, so the entry stays behind and the
   * next build mistakes it for a user file.
   *
   * 为什么绑之前先解绑：watch 每轮都会重写 target，重复 process.on 会累积监听器
   * （MaxListenersExceededWarning），旧闭包也会一直持有上一轮的 absTarget。
   * Unbind first: watch rewrites the target every round; repeated process.on leaks listeners.
   */
  let exitCleanup: {
    onExit: () => void;
    onSignal: (signal: NodeJS.Signals) => void;
  } | undefined;

  function unbindExitCleanup(): void {
    const fn = exitCleanup;

    if (!fn) {
      return;
    }

    process.off('exit', fn.onExit);
    process.off('SIGINT', fn.onSignal);
    process.off('SIGTERM', fn.onSignal);
    exitCleanup = undefined;
  }

  function bindExitCleanup(): void {
    unbindExitCleanup();

    const onExit = (): void => {
      try {
        rmSync(absTarget, { force: true });
      }
      catch {
        // 退出阶段尽力而为：清理失败不能改变退出码。
      }
    };

    /*
     * 信号事件必须用独立 handler：
     *   1. 注册 SIGINT / SIGTERM 监听会移除 Node 的默认退出行为
     *      （文档：its default behavior will be removed, Node.js will no longer exit），
     *      所以必须自己调 process.exit；
     *   2. 'exit' 事件的参数是退出码（number），与信号无关 —— 两者共用一个签名
     *      会把退出码当成 signal 处理。
     * Separate handlers: a signal listener disables Node's default exit, so we must exit
     * ourselves; 'exit' receives an exit code, not a signal.
     */
    const onSignal = (signal: NodeJS.Signals): void => {
      onExit();
      process.exit(signal === 'SIGINT' ? 130 : 143);
    };

    exitCleanup = { onExit, onSignal };
    process.once('exit', onExit);
    process.once('SIGINT', onSignal);
    process.once('SIGTERM', onSignal);
  }

  /*
   * writeTarget — 幂等写入组合入口
   * writeTarget — Idempotently writes the combined entry
   *
   * 两条规则：
   *   1. 只拒绝"不是本插件生成的文件"：内容一致说明是上次中断留下的残留，直接复用，
   *      否则一次残留会让插件永久起不来；
   *   2. 内容一致就不写：watch 每轮都会调用它，无条件 writeFileSync 会更新 mtime，
   *      被 watcher 当成源码变更触发下一轮，形成无限重建。
   * Two rules:
   *   1. Only reject files NOT generated by us — identical content means a leftover from an
   *      interrupted build, which is reused so a single leftover cannot block startup forever;
   *   2. Never write when content is unchanged: it runs every watch round, and an unconditional
   *      write bumps mtime, which the watcher reports as a change and loops forever.
   */
  function writeTarget(): string {
    const code = renderCode();

    if (existsSync(absTarget)) {
      const previous = readFileSync(absTarget, 'utf-8');

      if (previous === code) {
        bindExitCleanup();
        return code;
      }

      /*
       * 上一次构建被 SIGKILL 强杀（退出钩子也拦不住）时留下的残留：
       * 只要带我们的生成标记，就是自己的产物，可以安全覆盖。
       * 没有标记的才可能是用户文件，必须中断构建而不是覆盖。
       * A leftover from a SIGKILLed build still carries our marker, so it is safe to
       * overwrite; anything without the marker may be user code and must abort.
       */
      if (!previous.includes(GENERATED_MARKER)) {
        throw new Error(
          `File '${absTarget}' already exists and was not generated by ${PLUGIN_NAME}. `
          + 'Choose a different `target` or remove that file.'
        );
      }
    }

    writeFileSync(absTarget, code, 'utf-8');
    bindExitCleanup();
    return code;
  }


  let outDir = 'dist';
  let hasLib = false;

  /*
   * viteCombine 插件对象 — 核心执行逻辑
   * viteCombine plugin object — Core execution logic
   *
   * enforce 默认 'post'：确保在其它改写 lib.entry 的插件之后再合并
   *                      Defaults to 'post' to merge after other plugins modify lib.entry
   */
  const viteCombine = {
    name: PLUGIN_NAME,
    enforce: ('enforce' in opts) ? opts.enforce : 'post',
    apply: opts.apply,

    /*
     * config 钩子 — 落盘组合入口 + 注册构建入口
     * config hook — Writes the combined entry and registers build entries
     *
     * 这里必须写盘：config 是所有 buildStart 之前唯一一定会执行的钩子，
     * 只有此刻文件已在磁盘上，vite-plugin-dts 才能在它自己的 buildStart 里读到组合入口。
     * Writing here is mandatory: config runs before every buildStart, and only then can
     * vite-plugin-dts see the combined entry when it builds its TS program.
     */
    async config(config) {
      const code = writeTarget();
      logger.debug(`Result:\n${code}`);

      const inputs = files.concat(absTarget);
      const build = config.build;
      const lib = build?.lib;

      /*
       * lib 模式：合并进 build.lib.entry，保留用户已有的 key 与顺序
       * Lib mode: merge into build.lib.entry, preserving the user's keys and order
       */
      if (lib) {
        const original = typeof lib === 'object' ? lib.entry : undefined;
        logger.debug('Original `lib.entry`:', original);

        const entry = rebuildInput(original, inputs);
        logger.debug('New `lib.entry`:', entry);
        return { build: { lib: { entry } } };
      }

      /*
       * app 模式：作为额外 input 追加，绝不碰 build.lib
       * App mode: append as an extra input, never touch build.lib
       *
       * 一旦设置了 input，vite 就不再回退到默认的 index.html，所以必须显式带上它；
       * 但 index.html 不存在时不能凭空注入，否则整个构建会因为找不到入口而失败。
       * Once `input` is set, Vite no longer falls back to index.html, so it must be included
       * explicitly; but it must not be injected when missing, or the build fails outright.
       */
      const root = config.root ? resolve(cwd, config.root) : cwd;

      let baseInput = build?.rolldownOptions?.input ?? build?.rollupOptions?.input;
      if (!baseInput) {
        const indexHtml = resolve(root, 'index.html');

        if (existsSync(indexHtml)) {
          baseInput = { index: indexHtml };
        }
      }

      const input = appendEntry(baseInput, targetStem, absTarget);

      logger.debug('Build input:', input);
      return { build: { rolldownOptions: { input } } };
    },

    /*
     * configResolved 钩子 — 记录最终 outDir、构建模式，并给出 watch 告警
     * configResolved hook — Captures outDir / lib mode and warns about watch
     *
     * outDir 只有在配置解析完成后才是最终值；hasLib 决定收尾时要不要对齐声明扩展名。
     * outDir is only final after resolution, and hasLib decides whether to align declaration
     * extensions when the build ends.
     */
    configResolved(config) {
      outDir = config.build.outDir;
      hasLib = Boolean(config.build.lib);

      /*
       * 配了 dts 时 watch 不可信：vite-plugin-dts 只在首轮产声明，之后改源文件不会更新。
       * 未配 dts 时 watch 正常，JS 增量和本插件的 buildStart 补写都已覆盖。
       * Watch is unreliable with dts: vite-plugin-dts only emits declarations on the first
       * build. Without dts, watch works fine — JS incremental builds plus buildStart rewrite.
       */
      if (config.build.watch && opts.dts) {
        logger.warn('vite-plugin-dts does not regenerate declarations on watch rebuilds. '
          + 'Combined types stay stale until the next full build.');
      }
    },

    /*
     * buildStart 钩子 — 每轮构建前补齐组合入口
     * buildStart hook — Re-creates the combined entry before each build round
     *
     * config 在 watch 下只跑一次，若入口文件在两次构建之间被删掉（手动删除、上次中断），
     * 下一轮会因 entry 缺失而失败。buildStart 与 closeBundle 同频，在这里补写即可自愈。
     * `config` runs once under watch, so a deleted entry would break the next round.
     * buildStart runs as often as closeBundle, making the rewrite self-healing.
     */
    buildStart() {
      writeTarget();
    },

    /*
     * closeBundle 钩子 — 对齐声明扩展名，并清理组合入口
     * closeBundle hook — Aligns declaration extensions and cleans up the entry
     *
     * 为什么在 closeBundle：vite-plugin-dts 在自己的 writeBundle 里落盘声明，
     *                       closeBundle 一定晚于它，此时声明已全部就绪。
     * Why closeBundle: vite-plugin-dts writes declarations in its own writeBundle, which
     * always runs before closeBundle, so the declarations are ready.
     */
    closeBundle() {
      /*
       * 只在 lib 模式对齐声明扩展名：app 模式的产物是 'assets/<stem>-<hash>.js'，
       * 没有同名 '<stem>.js'，配对无从谈起，硬做只会误报"未产出声明"。
       * Only align in lib mode: app outputs are 'assets/<stem>-<hash>.js' with no matching
       * '<stem>.js', so pairing is moot and checking it would emit a misleading warning.
       */
      if (opts.dts && hasLib) {
        const declarations = syncDeclarations(outDir);

        if (declarations.length) {
          logger.debug('Declarations:', declarations);
        }
        else {
          logger.warn(`No declaration emitted in '${outDir}'. `
            + "Check that 'target' sits inside vite-plugin-dts 'include' and has a '.ts' extension.");
        }
      }

      /*
       * watch 下保留入口：下一轮构建开始时它必须还在，dts 建 program 时才能读到。
       * 进程退出后的残留由 writeTarget 的内容比对兜底（内容一致即复用）。
       * Keep it under watch: the next round needs it on disk before dts builds its program.
       * Leftovers after the process exits are covered by writeTarget's content check.
       */
      if (this.meta.watchMode) {
        return;
      }

      /*
       * 同步删除：异步 unlink 在进程先退出时不保证执行，入口会残留在源码目录。
       * Delete synchronously: an async unlink may never run if the process exits first,
       * leaving the entry behind inside the source tree.
       */
      if (existsSync(absTarget)) {
        unlinkSync(absTarget);
        logger.debug(`'${absTarget}' has been removed.`);
      }

      // target 已经删掉，退出清理钩子没有存在意义，解绑避免监听器泄漏。
      unbindExitCleanup();
    }
  } as Plugin;

  /*
   * dts 条件返回：
   *   - 未配置 dts：只返回本插件
   *   - dts === true：以默认参数启用 vite-plugin-dts
   *   - dts 为对象：透传配置，但 include 与 entryRoot 必须由我们合并后覆盖
   * Conditional dts return:
   *   - dts unset: return this plugin only
   *   - dts === true: enable vite-plugin-dts with defaults
   *   - dts object: pass through, but include/entryRoot must be merged by us
   */
  const dtsOpts = opts.dts;
  if (!dtsOpts) {
    return viteCombine;
  }

  /*
   * include 必须"合并"而不是"覆盖"：旧写法 Object.assign({ include }, dtsOpts) 中，
   * 用户只要传了 include，就会把源文件与组合入口整份顶掉，入口不在扫描范围内，
   * 声明静默缺失（不报错，只是少一个文件）。
   * include must be MERGED: with the old Object.assign form, any user-supplied include
   * replaced ours entirely, silently dropping the combined entry from the scan.
   *
   * entryRoot 交给 dts 自行推断：它会取 include 里所有文件的公共父目录（这里是 src，
   * 因为 target 落在 src 根而源文件在 src/util），产出与说明符都由该目录推导，
   * 手写一遍只会得到同一个值。若日后把 target 移出 include，公共目录会自动变成
   * src/util，声明随之扁平化——届时无需再调整任何参数。
   * entryRoot is left to dts: it derives the common parent of everything in `include`.
   */
  const dtsOptions: DtsPluginOptions = dtsOpts === true ? {} : { ...dtsOpts };
  const userInclude = dtsOptions.include;
  const include = (Array.isArray(userInclude) ? userInclude : userInclude ? [userInclude] : [])
    .concat(files, absTarget);

  return [
    viteCombine,
    dts({
      ...dtsOptions,
      include
    }) as Plugin
  ];
}
