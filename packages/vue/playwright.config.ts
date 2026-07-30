import { defineConfig, devices } from '@playwright/test';

// Playwright forces colored output in its worker processes. Forwarding NO_COLOR
// alongside it makes Node emit a warning for every worker and web server.
Reflect.deleteProperty(process.env, 'NO_COLOR');

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://127.0.0.1:5174',
    trace: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: {
    command: 'pnpm exec vite demo --config demo/vite.config.ts --host 127.0.0.1 --port 5174',
    reuseExistingServer: !process.env.CI,
    url: 'http://127.0.0.1:5174'
  }
});
