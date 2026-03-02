export async function timed<T>(label: string, promise: Promise<T>): Promise<T> {
  const start = performance.now();
  try {
    return await promise;
  } finally {
    console.log(`${label} took ${(performance.now() - start).toFixed(2)}ms`);
  }
}
