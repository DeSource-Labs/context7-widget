import { fileURLToPath } from 'node:url';
import type { ViteUserConfig } from 'vitest/config';

export function createFrameworkTestConfig(packageUrl: string): ViteUserConfig {
  return {
    resolve: {
      alias: {
        '@src': fileURLToPath(new URL('./src', packageUrl)),
        '@common': fileURLToPath(new URL('../../common', packageUrl)),
        '@desource/context7-widget/kit': fileURLToPath(new URL('../core/src/kit.ts', packageUrl))
      }
    },
    test: {
      environment: 'jsdom',
      pool: 'forks',
      isolate: true,
      fsModuleCache: true,
      globals: true,
      restoreMocks: true,
      unstubGlobals: true,
      coverage: {
        exclude: ['src/**/*.d.ts'],
        thresholds: { branches: 95, functions: 99, lines: 99, statements: 98 }
      }
    }
  };
}
