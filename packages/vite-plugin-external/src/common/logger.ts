import { Level, LogFactory } from 'base-log-factory';
import { ColorfulAppender } from 'blf-colorful-appender';

import { PLUGIN_NAME } from './constants';

export const logFactory = new LogFactory({
  level: Level.WARN,
  appenders: [
    new ColorfulAppender()
  ]
});

export const logger = logFactory.getLogger(PLUGIN_NAME);
