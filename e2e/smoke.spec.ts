import { expect, test } from '@playwright/test'

import { APP_URL } from './helpers'

test.describe('live deploy smoke', () => {
  test('app loads with title, tuning picker, and string buttons', async ({ page }) => {
    await page.goto(APP_URL)
    await expect(page).toHaveTitle(/Anystring/)
    await expect(page.getByRole('button', { name: 'Standard E' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start tuning' })).toBeVisible()
    await expect(page.getByRole('button', { name: '1 E2' })).toBeVisible()
    await expect(page.getByRole('button', { name: '6 E4' })).toBeVisible()
  })

  test('tuning picker opens and lists presets', async ({ page }) => {
    await page.goto(APP_URL)
    await page.getByRole('button', { name: 'Standard E' }).click()
    await expect(
      page.getByRole('heading', { name: 'Tunings', exact: true }),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: /^Drop D D2/ })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Close' })).toBeVisible()
  })

  test('string gauges render above each note button', async ({ page }) => {
    await page.goto(APP_URL)
    await expect(page.locator('.string-gauge')).toHaveCount(6)
  })
})
