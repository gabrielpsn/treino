import { defineConfig, devices } from '@playwright/test';

const PORT = 5176;

export default defineConfig({
  // tests/unit é do Vitest; aqui só entram os specs de navegador.
  testDir: './tests/e2e',
  timeout: 30000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    headless: true,
    viewport: { width: 1280, height: 800 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  // Sem este bloco, `npm run test:visual` falhava porque baseURL apontava para
  // 5176 enquanto o dev server do Vite sobe na 5173.
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60000
  }
});