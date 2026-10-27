import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test as base } from '@playwright/test';

export const test = base.extend({
  launchOptions: [
    async ({ browserName, launchOptions }, use) => {
      if (browserName !== 'firefox' || process.platform !== 'darwin') {
        await use(launchOptions);
        return;
      }

      // Firefox 157 accesses the shared app-data directory even with a temporary profile.
      // macOS 27 protects that directory: https://github.com/microsoft/playwright/issues/42768
      const appDataDirectory = await mkdtemp(join(tmpdir(), 'context7-firefox-app-data-'));
      try {
        // Pre-create these folders so macOS does not add deny-delete ACLs during browser startup.
        await Promise.all(
          ['Downloads', 'Library/Application Support'].map((name) =>
            mkdir(join(appDataDirectory, name), { mode: 0o700, recursive: true })
          )
        );
        await use({
          ...launchOptions,
          env: { ...process.env, ...launchOptions.env, CFFIXED_USER_HOME: appDataDirectory }
        });
      } finally {
        await rm(appDataDirectory, { recursive: true, force: true });
      }
    },
    { scope: 'worker' }
  ]
});
