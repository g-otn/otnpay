import { pino } from 'pino';

export const logger = pino({
  browser: {},
  transport: {
    options: {
      colorize: true,
    },
    target: 'pino-pretty',
  },
});
