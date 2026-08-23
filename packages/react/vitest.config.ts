import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@common', replacement: fileURLToPath(new URL('../../common', import.meta.url)) },
      {
        find: '@desource/context7-widget/kit',
        replacement: fileURLToPath(new URL('../core/src/kit.ts', import.meta.url))
      }
    ]
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/unit/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: ['tests/setup.ts'],
    restoreMocks: true,
    unstubGlobals: true,
    coverage: {
      exclude: ['src/**/*.d.ts'],
      include: ['src/**/*.{ts,tsx}'],
      thresholds: { branches: 95, functions: 99, lines: 99, statements: 98 }
    }
  }
});
