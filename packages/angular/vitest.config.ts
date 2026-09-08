import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    restoreMocks: true,
    unstubGlobals: true,
    coverage: {
      reportsDirectory: 'coverage'
    }
  },
  resolve: {
    alias: {
      '@src': fileURLToPath(new URL('./src', import.meta.url)),
      '@common': fileURLToPath(new URL('../../common', import.meta.url)),
      '@desource/context7-widget/kit': fileURLToPath(new URL('../core/src/kit.ts', import.meta.url))
    }
  }
});
