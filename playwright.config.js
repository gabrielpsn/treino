import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:5176',
    headless: true,
    viewport: { width: 1280, height: 800 },
    screenshot: 'on',
    trace: 'off'
  },
  projects: [
    {
      name: 'chromium',
      use: { channel: 'chrome' }
    }
  ]
});
