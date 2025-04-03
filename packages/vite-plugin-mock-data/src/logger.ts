import { Level, Logger } from 'base-log-factory';
import { ColorfulAppender } from 'blf-colorful-appender';

import pkg from '../package.json';

export const PLUGIN_NAME = pkg.name;

export const logger =  new Logger(PLUGIN_NAME, {
  level: Level.WARN,
  appenders: [
    new ColorfulAppender()
  ]
});
