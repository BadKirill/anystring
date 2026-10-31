import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e/store',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: 'list',
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'off',
  },
  projects: [
    {
      name: 'ios-6.7',
      use: {
        viewport: { width: 430, height: 932 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        launchOptions: {
          args: ['--autoplay-policy=no-user-gesture-required'],
        },
      },
    },
    {
      name: 'duo-outer',
      use: {
        viewport: { width: 466, height: 678 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        launchOptions: {
          args: ['--autoplay-policy=no-user-gesture-required'],
        },
      },
    },
    {
      name: 'duo-inner',
      use: {
        viewport: { width: 669, height: 951 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        launchOptions: {
          args: ['--autoplay-policy=no-user-gesture-required'],
        },
      },
    },
    {
      name: 'duo-landscape',
      use: {
        viewport: { width: 951, height: 669 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        launchOptions: {
          args: ['--autoplay-policy=no-user-gesture-required'],
        },
      },
    },
    {
      name: 'android-phone',
      use: {
        viewport: { width: 432, height: 768 },
        deviceScaleFactor: 2.5,
        isMobile: true,
        hasTouch: true,
        launchOptions: {
          args: ['--autoplay-policy=no-user-gesture-required'],
        },
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173/app/',
    reuseExistingServer: !process.env.CI,
  },
})
