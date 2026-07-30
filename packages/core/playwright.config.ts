import { defineConfig, devices } from '@playwright/test';

Reflect.deleteProperty(process.env, 'NO_COLOR');

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://127.0.0.1:5175',
    trace: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: {
    command: 'pnpm exec vite demo --host 127.0.0.1 --port 5175',
    reuseExistingServer: !process.env.CI,
    url: 'http://127.0.0.1:5175'
  }
});
