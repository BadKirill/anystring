import { expect, test } from '@playwright/test'

import { APP_URL, stubMicrophone } from './helpers'

test('stop tuning updates the button immediately', async ({ page }) => {
  await stubMicrophone(page, 110)
  await page.goto(APP_URL)

  await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible()

  await page.getByRole('button', { name: 'Stop' }).click()
  await expect(page.getByRole('button', { name: 'Start tuning' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Stop' })).not.toBeVisible()
})
