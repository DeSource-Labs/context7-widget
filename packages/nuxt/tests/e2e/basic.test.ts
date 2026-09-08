import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { $fetch, createPage, setup, url } from '@nuxt/test-utils/e2e';
import { describe, expect, it } from 'vitest';
import { getBuildDir, getFixtureRoot } from './utils';

const fixtureRoot = getFixtureRoot('../fixtures/basic', import.meta.url);

await setup({ browser: true, rootDir: fixtureRoot });

describe('Nuxt module basic fixture', () => {
  it('server-renders the auto-imported component with module defaults and composable', async () => {
    const html = await $fetch('/');

    expect(html).toContain('context7-widget-nuxt:basic-ok');
    expect(html).toContain('id="composable-status">composable:yes</div>');
    expect(html).toContain('id="hydration-status">hydration:pending</div>');
    expect(html).toContain('class="context7-widget"');
    expect(html).toContain('library="/vercel/nuxt"');
    expect(html).toContain('position="anchor"');
    expect(html).toContain('widget-id="nuxt-docs"');
  });

  it('hydrates without browser errors and opens and closes the widget', async () => {
    const page = await createPage();
    const browserErrors: string[] = [];

    page.on('console', (message) => {
      if (message.type() === 'error') browserErrors.push(message.text());
    });
    page.on('pageerror', (error) => browserErrors.push(error.message));

    try {
      await page.goto(url('/'), { waitUntil: 'hydration' });

      const hydrationStatus = page.locator('#hydration-status');
      const trigger = page.locator('.context7-widget .c7-launcher');
      const panel = page.locator('.context7-widget dialog');

      await hydrationStatus.waitFor({ state: 'visible' });
      expect(await hydrationStatus.textContent()).toBe('hydration:ready');
      expect(await trigger.getAttribute('aria-expanded')).toBe('false');

      await trigger.click();
      await panel.waitFor({ state: 'visible' });
      expect(await trigger.getAttribute('aria-expanded')).toBe('true');

      await page.getByRole('button', { name: 'Close chat' }).click();
      await panel.waitFor({ state: 'hidden' });
      expect(await trigger.getAttribute('aria-expanded')).toBe('false');
      expect(browserErrors).toEqual([]);
    } finally {
      await page.close();
    }
  });

  it('generates component and composable imports', async () => {
    const buildDir = getBuildDir();
    const components = await readFile(resolve(buildDir, 'components.d.ts'), 'utf8');
    const imports = await readFile(resolve(buildDir, 'imports.d.ts'), 'utf8');

    expect(components).toContain('Context7Widget');
    expect(components).toContain('runtime/component');
    expect(imports).toContain('useContext7Widget');
    expect(imports).toContain('runtime/composable');
    expect(components).not.toContain("from '@desource/context7-widget-vue'");
    expect(imports).not.toContain("from '@desource/context7-widget-vue'");
  });
});
