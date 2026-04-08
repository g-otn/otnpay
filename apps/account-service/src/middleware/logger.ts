import pino from 'pino';

export const logger = pino({
  base: null,
  level: 'debug',
  timestamp: pino.stdTimeFunctions.epochTime,
});
