export type AppEnv = {
  Bindings: Cloudflare.Env;
  Variables: {
    dbAppName: string;
    requestId: string;
  };
};
