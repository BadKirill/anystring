import { defineConfig, devices } from '@playwright/test'

const liveBaseUrl = process.env.PLAYWRIGHT_BASE_URL
const isLiveCheck = liveBaseUrl !== undefined && liveBaseUrl !== ''

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: isLiveCheck ? liveBaseUrl : 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'mobile-chromium',
      use: {
        ...devices['Pixel 7'],
        launchOptions: {
          args: ['--autoplay-policy=no-user-gesture-required'],
        },
      },
    },
  ],
  webServer: isLiveCheck
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:5173/anystring/',
        reuseExistingServer: !process.env.CI,
      },
})
