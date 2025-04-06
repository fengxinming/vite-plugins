import { inspect } from 'node:util';

import { Level, LogEvent, LogFactory, PatternLayout, TPatternConverter } from 'base-log-factory';
import { DebugAppender } from 'blf-debug-appender';

function createConverter(specifier: string): TPatternConverter | undefined {
  if (specifier === 'm') {
    return (event: LogEvent): string => {
      return event.message.map((msg) => {
        switch (typeof msg) {
          case 'object':
            return inspect(msg);
          case 'symbol':
            return msg.toString();
          default:
            return msg;
        }
      }).join(' ');
    };
  }
}

export const logFactory = new LogFactory({
  level: Level.WARN,
  appenders: [
    new DebugAppender({
      layout: new PatternLayout(
        '%d{HH:mm:ss} [%p] - %m',
        createConverter
      )
    })
  ]
});
