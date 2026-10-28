import { defineConfig } from '@playwright/test';
import path from 'node:path';
export default defineConfig({
  testDir: './e2e', fullyParallel: false, workers: 1, retries: 0,
  reporter: 'list', outputDir: '../../output/playwright/results',
  use: { baseURL: 'http://127.0.0.1:3100', channel: 'chrome', headless: true, screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run start --workspace @dksi/web -- --port 3100 --hostname 127.0.0.1',
    cwd: path.resolve(import.meta.dirname, '../..'), url: 'http://127.0.0.1:3100',
    reuseExistingServer: false, timeout: 30_000,
    env: { OPENROUTER_API_KEY: '' },
  },
});
