import { expect, test } from '@playwright/test'

import { APP_URL } from './helpers'

test('About sheet can turn anonymous statistics off', async ({ page }) => {
  await page.goto(APP_URL)
  await page.getByRole('button', { name: 'About' }).click()
  await expect(page.getByRole('heading', { name: 'About Anystring' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'On', pressed: true })).toBeVisible()
  await page.getByRole('button', { name: 'On', pressed: true }).click()
  await expect(page.getByRole('button', { name: 'Off', pressed: false })).toBeVisible()
})
