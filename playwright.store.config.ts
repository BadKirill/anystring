import { defineConfig } from '@playwright/test'

/**
 * Store listing screenshots at App Store / Play Console phone sizes.
 * Run: npm run screenshots:store
 *
 * Android: phone CSS width (not 1080 CSS px — that left empty margins beside the
 * 480px-capped app). Height is exactly 9:16 so Play gets 1080×1920 without the
 * ultra-tall crop: 432×768 @2.5 → exact 1080×1920.
 */
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
