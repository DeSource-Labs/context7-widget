import { defineConfig } from '@playwright/test';
import { context7E2EProjects } from '../../common/tests/e2e/projects';

Reflect.deleteProperty(process.env, 'NO_COLOR');

export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: 'http://127.0.0.1:5177', trace: 'retain-on-failure' },
  projects: context7E2EProjects,
  webServer: {
    command: 'pnpm exec vite demo --config demo/vite.config.ts --host 127.0.0.1 --port 5177',
    reuseExistingServer: !process.env.CI,
    url: 'http://127.0.0.1:5177'
  }
});
