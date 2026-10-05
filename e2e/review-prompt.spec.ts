import { expect, test } from '@playwright/test'

import { APP_URL, stubMicrophone } from './helpers'

const A2_HZ = 110

test('asks for a store rating after the third in-tune session', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'anystring.v2.reviewState',
      JSON.stringify({ successfulSessions: 2, lastRequest: null }),
    )
  })
  await stubMicrophone(page, A2_HZ)
  await page.goto(APP_URL)
  await page.getByRole('button', { name: 'Start tuning' }).click()
  await expect(page.getByText('String 2 (A2): in tune')).toBeVisible()
  await page.getByRole('button', { name: 'Stop' }).click()
  await expect(page.getByText(/Enjoying Anystring/)).toBeVisible()
  await expect(page.getByRole('link', { name: 'App Store' })).toBeVisible()
})
