import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(() => ({
  cacheDir: '../../../node_modules/.vite/libs/shop/feature-product-detail',
  plugins: [react()],
  root: __dirname,
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },
  test: {
    coverage: {
      include: ['src/**/*.{ts,tsx}'],
      provider: 'v8' as const,
      reportsDirectory: './test-output/vitest/coverage',
    },
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    name: '@otnpay/feature-product-detail',
    reporters: ['default'],
    setupFiles: ['./src/test-setup.ts'],
    watch: false,
  },
}));
