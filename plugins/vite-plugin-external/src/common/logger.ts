import type { Logger } from 'base-log-factory';
import { logFactory } from 'vp-runtime-helper';

import { PLUGIN_NAME } from './constants';

/**
 * Single shared logger instance for the entire plugin.
 * A unique instance (rather than console.*) lets users filter output via
 * Options.logLevel without affecting other plugins.
 *
 * 插件共享的日志单例。使用独立 logger 而不是 console.*：
 * 用户可以通过 Options.logLevel 只调整本插件的日志粒度，不影响其他 Vite 插件。
 */
export const logger: Logger = logFactory.getLogger(PLUGIN_NAME);
