import vue from '@vitejs/plugin-vue';
import { defineConfig, mergeConfig } from 'vitest/config';
import { createFrameworkTestConfig } from '../../common/tests/vitest.config.js';

export default mergeConfig(
  createFrameworkTestConfig(import.meta.url),
  defineConfig({
    plugins: [vue()],
    test: {
      include: ['tests/unit/**/*.{test,spec}.{ts,tsx}'],
      coverage: {
        include: ['src/**/*.{ts,vue,js}']
      }
    }
  })
);
