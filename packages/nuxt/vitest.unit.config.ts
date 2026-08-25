import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/unit/**/*.{test,spec}.ts'],
    restoreMocks: true,
    coverage: {
      include: ['src/**/*.ts'],
      thresholds: {
        branches: 95,
        functions: 100,
        lines: 100,
        statements: 100
      }
    }
  }
});
