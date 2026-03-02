import { Logger } from 'pino';

export type AppEnv = {
  Bindings: Cloudflare.Env;
  Variables: {
    dbAppName: string;
    log: Logger;
    requestId: string;
  };
};
