import pino from 'pino';

export const log = pino({
  base: null,
  level: 'debug',
  timestamp: pino.stdTimeFunctions.epochTime,
});
