import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
      {
        find: '@desource/context7-widget/kit',
        replacement: fileURLToPath(new URL('../../core/src/kit.ts', import.meta.url))
      }
    ]
  }
});
