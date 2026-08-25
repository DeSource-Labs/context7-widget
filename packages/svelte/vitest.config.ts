import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    conditions: ['browser'],
    alias: [
      { find: '@common', replacement: fileURLToPath(new URL('../../common', import.meta.url)) },
      {
        find: '@desource/context7-widget/kit',
        replacement: fileURLToPath(new URL('../core/src/kit.ts', import.meta.url))
      },
      {
        find: '@desource/context7-widget',
        replacement: fileURLToPath(new URL('../core/src/index.ts', import.meta.url))
      }
    ]
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/unit/**/*.{test,spec}.ts'],
    restoreMocks: true,
    unstubGlobals: true,
    coverage: {
      exclude: ['src/**/*.d.ts'],
      include: ['src/**/*.{ts,svelte}'],
      thresholds: { branches: 95, functions: 99, lines: 99, statements: 98 }
    }
  }
});
