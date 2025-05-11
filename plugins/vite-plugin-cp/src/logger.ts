
import { logFactory } from 'vp-runtime-helper';

import { name } from '../package.json';

export const PLUGIN_NAME = name;

export const logger = logFactory.getLogger(PLUGIN_NAME);
