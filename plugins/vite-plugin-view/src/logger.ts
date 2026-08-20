import { logFactory, Logger } from 'vp-runtime-helper';

import { name } from '../package.json' with { type: 'json' };

export const PLUGIN_NAME = name;

export const logger: Logger = logFactory.getLogger(PLUGIN_NAME);
