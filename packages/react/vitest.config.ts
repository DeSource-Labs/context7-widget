import react from '@vitejs/plugin-react';
import { defineConfig, mergeConfig } from 'vitest/config';
import { createFrameworkTestConfig } from '../../common/tests/vitest.config.js';

export default mergeConfig(
  createFrameworkTestConfig(import.meta.url),
  defineConfig({
    plugins: [react()],
    test: {
      include: ['tests/unit/**/*.{test,spec}.{ts,tsx}'],
      setupFiles: ['tests/setup.ts'],
      coverage: {
        include: ['src/**/*.{ts,tsx}']
      }
    }
  })
);
