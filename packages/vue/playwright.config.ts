import { defineConfig, devices } from '@playwright/test';

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
