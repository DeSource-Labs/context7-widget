import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [svelte({ configFile: fileURLToPath(new URL('../svelte.config.js', import.meta.url)) })],
  resolve: {
    alias: [
      {
        find: '@desource/context7-widget/kit',
        replacement: fileURLToPath(new URL('../../core/src/kit.ts', import.meta.url))
      },
      {
        find: '@desource/context7-widget',
        replacement: fileURLToPath(new URL('../../core/src/index.ts', import.meta.url))
      }
    ]
  }
});
