import path from 'path'
import { defineConfig, devices } from '@playwright/test'

require('dotenv').config({ path: path.join(__dirname, '..', '.env.test') })

const e2ePort = process.env.E2E_PORT || '3001'
const e2eBaseUrl = `http://localhost:${e2ePort}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: e2eBaseUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: process.env.CI
    ? [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
    : [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
        { name: 'webkit', use: { ...devices['Desktop Safari'] } },
        { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
        { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
      ],
  webServer: {
    command: `npm run dev -- -p ${e2ePort}`,
    url: e2eBaseUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      ...process.env,
      AUTH_TRUST_HOST: 'true',
      DISABLE_RATE_LIMIT: 'true',
      NEXTAUTH_URL: e2eBaseUrl,
      NEXTAUTH_SECRET:
        process.env.NEXTAUTH_SECRET || 'test-secret-32-characters-long!!!',
    },
  },
})
