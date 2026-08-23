import { devices } from '@playwright/test';

export const context7E2EProjects = [
  {
    name: 'Desktop Chrome',
    use: { ...devices['Desktop Chrome'] }
  },
  {
    name: 'Desktop Firefox',
    use: { ...devices['Desktop Firefox'] }
  },
  {
    name: 'Desktop Safari',
    use: { ...devices['Desktop Safari'] }
  },
  {
    name: 'Mobile Safari',
    use: { ...devices['iPhone 13'] }
  }
];
