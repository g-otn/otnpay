import { defineConfig } from 'vitest/config';

export default defineConfig({
  cacheDir: '../../../node_modules/.vite/libs/api/products',
  root: __dirname,
  test: {
    coverage: {
      include: ['src/**/*.ts'],
      provider: 'v8',
      reportsDirectory: './test-output/vitest/coverage',
    },
    environment: 'node',
    globals: true,
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}'],
    name: '@otnpay/products',
    reporters: ['default'],
    watch: false,
  },
});
