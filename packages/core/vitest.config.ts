import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.{test,spec}.ts'],
    globals: true,
    restoreMocks: true,
    coverage: {
      exclude: ['src/**/*.d.ts'],
      include: ['src/**/*.{ts,js,mjs,cjs}'],
      thresholds: {
        branches: 73,
        functions: 91,
        lines: 92,
        statements: 89
      }
    }
  }
});
