import { isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { useTestContext } from '@nuxt/test-utils/e2e';

export const getFixtureRoot = (fixturePath: string, fromUrl: string): string =>
  fileURLToPath(new URL(fixturePath, fromUrl));

export function getBuildDir(): string {
  const { nuxt, options } = useTestContext();
  if (nuxt?.options.buildDir) return nuxt.options.buildDir;

  const configuredBuildDir = (options.nuxtConfig.buildDir as string | undefined) ?? '.nuxt';
  return isAbsolute(configuredBuildDir) ? configuredBuildDir : resolve(options.rootDir, configuredBuildDir);
}
