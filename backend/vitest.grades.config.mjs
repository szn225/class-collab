import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// The mini-program sources live outside backend, where test dependencies reside.
export default defineConfig({
  root: fileURLToPath(new URL('../miniprogram/packages/grades/', import.meta.url)),
  resolve: {
    alias: {
      vitest: fileURLToPath(new URL('./node_modules/vitest/dist/index.js', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['core/__tests__/**/*.test.ts', 'datasource/__tests__/**/*.test.ts'],
  },
});
