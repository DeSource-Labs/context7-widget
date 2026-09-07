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
    fsModuleCache: true,
    // Browser-global stubs require forks; jsdom VM globals cannot be redefined.
    pool: 'forks',
    // Each file needs a fresh custom-element registry and module state.
    isolate: true,
    include: ['tests/unit/**/*.{test,spec}.ts'],
    globals: true,
    restoreMocks: true,
    unstubGlobals: true,
    coverage: {
      exclude: ['src/**/*.d.ts'],
      include: ['src/**/*.{ts,js,mjs,cjs}'],
      thresholds: {
        branches: 95,
        functions: 99,
        lines: 99,
        statements: 99
      }
    }
  }
});
