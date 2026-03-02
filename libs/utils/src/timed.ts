import { Logger } from 'pino';

export async function timed<T>(
  label: string,
  promise: Promise<T>,
  log: Logger
): Promise<T> {
  const start = Date.now();
  try {
    return await promise;
  } finally {
    log.info(`${label} (${Date.now() - start}ms)`);
  }
}
