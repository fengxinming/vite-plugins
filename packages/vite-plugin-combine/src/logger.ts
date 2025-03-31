import { Level, Logger } from 'base-log-factory';
import { ColorfulAppender } from 'blf-colorful-appender';

export const PLUGIN_NAME = 'vite-plugin-combine';

export const logger = new Logger(PLUGIN_NAME, {
  level: Level.WARN,
  appenders: [
    new ColorfulAppender()
  ]
});
