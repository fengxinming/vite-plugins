import { logFactory, Logger } from 'vp-runtime-helper';

import { PLUGIN_NAME } from './constants';


export const logger: Logger = logFactory.getLogger(PLUGIN_NAME);
