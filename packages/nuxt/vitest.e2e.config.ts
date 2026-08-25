import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    fileParallelism: false,
    globals: true,
    hookTimeout: 120_000,
    include: ['tests/e2e/**/*.{test,spec}.ts'],
    sequence: {
      concurrent: false
    },
    testTimeout: 120_000
  }
});
