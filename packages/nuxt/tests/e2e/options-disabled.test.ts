import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { $fetch, setup } from '@nuxt/test-utils/e2e';
import { describe, expect, it } from 'vitest';
import { getBuildDir, getFixtureRoot } from './utils';

const fixtureRoot = getFixtureRoot('../fixtures/options-disabled', import.meta.url);

await setup({ rootDir: fixtureRoot });

describe('Nuxt module disabled-options fixture', () => {
  it('renders without optional runtime integrations', async () => {
    const html = await $fetch('/');

    expect(html).toContain('context7-widget-nuxt:options-off-ok');
    expect(html).not.toContain('class="context7-widget"');
  });

  it('does not generate component or composable imports', async () => {
    const buildDir = getBuildDir();
    const components = await readFile(resolve(buildDir, 'components.d.ts'), 'utf8');
    const imports = await readFile(resolve(buildDir, 'imports.d.ts'), 'utf8');

    expect(components).not.toContain('@desource/context7-widget-vue');
    expect(imports).not.toContain('useContext7Widget');
  });
});
