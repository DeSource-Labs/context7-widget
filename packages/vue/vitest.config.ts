import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@desource/context7-widget': fileURLToPath(new URL('../core/src/index.ts', import.meta.url))
    }
  },
  test: {
    environment: 'jsdom',
    globals: true
  }
});
