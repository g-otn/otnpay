import { Logger } from 'pino';

export async function timed<T>(
  label: string,
  promise: Promise<T>,
  log: Logger
): Promise<T> {
  const start = performance.now();
  try {
    return await promise;
  } finally {
    log.info(`${label} took ${performance.now() - start}ms`);
  }
}
