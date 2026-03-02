import { Logger } from 'pino';

export type AppEnv = {
  Bindings: Cloudflare.Env;
  Variables: {
    dbAppName: string;
    logger: Logger;
    requestId: string;
  };
};
