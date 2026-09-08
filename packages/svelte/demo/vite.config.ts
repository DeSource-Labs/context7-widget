import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [svelte({ configFile: fileURLToPath(new URL('../svelte.config.js', import.meta.url)) })],
  resolve: {
    alias: {
      '@desource/context7-widget/kit': fileURLToPath(new URL('../../core/src/kit.ts', import.meta.url)),
      '@desource/context7-widget': fileURLToPath(new URL('../../core/src/index.ts', import.meta.url))
    }
  }
});
