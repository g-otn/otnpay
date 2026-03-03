import { Logger } from 'pino';

export type AppEnv = {
  Bindings: Cloudflare.Env;
  Variables: {
    appName: string;
    logger: Logger;
    requestId: string;
    userId: number;
  };
};
