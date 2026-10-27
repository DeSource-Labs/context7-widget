import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'node:url';
import { defineConfig, mergeConfig } from 'vitest/config';
import { createFrameworkTestConfig } from '../../common/tests/vitest.config.js';

export default mergeConfig(
  createFrameworkTestConfig(import.meta.url),
  defineConfig({
    plugins: [svelte()],
    resolve: {
      conditions: ['browser'],
      alias: {
        '@desource/context7-widget': fileURLToPath(new URL('../core/src/index.ts', import.meta.url))
      }
    },
    test: {
      include: ['tests/unit/**/*.{test,spec}.ts'],
      coverage: {
        include: ['src/**/*.{ts,svelte}']
      }
    }
  })
);
