import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
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
    coverage: {
      exclude: ['src/**/*.d.ts'],
      include: ['src/**/*.{ts,vue,js}'],
      thresholds: {
        branches: 71,
        functions: 85,
        lines: 91,
        statements: 89
      }
    }
  }
});
