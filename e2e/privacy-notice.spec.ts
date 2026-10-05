import { expect, test } from '@playwright/test'

import { APP_URL } from './helpers'

test('privacy notice stays until the updated policy is accepted', async ({ page }) => {
  await page.goto(APP_URL)
  await expect(page.getByText('The privacy policy changed')).toBeVisible()
  const policy = page.getByRole('link', { name: 'Privacy policy' })
  await expect(policy).toHaveAttribute('href', 'https://anystring.app/privacy.html')
  await page.getByRole('button', { name: "I've read and agree" }).click()
  await expect(page.getByText('The privacy policy changed')).not.toBeVisible()
  await page.reload()
  await expect(page.getByText('The privacy policy changed')).not.toBeVisible()
})
