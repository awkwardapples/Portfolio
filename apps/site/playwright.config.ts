import { defineConfig, devices } from '@playwright/test';

/**
 * Browser tests (spec R, U.5): smoke, keyboard and axe checks against the
 * production build served by the Worker (`wrangler dev`), so routing,
 * headers and 404 handling are the real ones. Build first: `pnpm build`.
 */
const PORT = 8788;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    { name: 'phone', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `pnpm --filter @jl/edge exec wrangler dev --port ${PORT} --ip 127.0.0.1`,
    cwd: '../..',
    url: `http://127.0.0.1:${PORT}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'ignore',
  },
});
