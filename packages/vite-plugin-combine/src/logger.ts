import { Level, Logger } from 'base-log-factory';
import { ColorfulAppender } from 'blf-colorful-appender';

import { name } from '../package.json';

export const PLUGIN_NAME = name;

export const logger = new Logger(PLUGIN_NAME, {
  level: Level.WARN,
  appenders: [
    new ColorfulAppender()
  ]
});
