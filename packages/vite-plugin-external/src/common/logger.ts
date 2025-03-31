import { Level, Logger } from 'base-log-factory';
import { ColorfulAppender } from 'blf-colorful-appender';

import { PLUGIN_NAME } from './constants';

export const logger = new Logger(PLUGIN_NAME, {
  level: Level.WARN,
  appenders: [
    new ColorfulAppender()
  ]
});
