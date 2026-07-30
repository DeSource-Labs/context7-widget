import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@common': fileURLToPath(new URL('../../common', import.meta.url))
    }
  },
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.{test,spec}.ts'],
    globals: true,
    restoreMocks: true,
    unstubGlobals: true,
    coverage: {
      exclude: ['src/**/*.d.ts'],
      include: ['src/**/*.{ts,js,mjs,cjs}'],
      thresholds: {
        branches: 88,
        functions: 99,
        lines: 99,
        statements: 98
      }
    }
  }
});
