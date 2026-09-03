import { expect, test } from '@playwright/test'

import {
  APP_URL,
  referenceTonePlayCount,
  spyReferenceTone,
  stubMicrophone,
} from './helpers'

async function waitForTonePlays(page: import('@playwright/test').Page, min: number) {
  await expect
    .poll(async () => referenceTonePlayCount(page), { timeout: 5000 })
    .toBeGreaterThanOrEqual(min)
}

test.describe('reference tone playback', () => {
  test('plays a reference tone when tapping a string', async ({ page }) => {
    await spyReferenceTone(page)
    await page.goto(APP_URL)

    await expect.poll(async () => referenceTonePlayCount(page)).toBe(0)
    await page.getByRole('button', { name: '1 E2' }).click()
    await waitForTonePlays(page, 1)
  })

  test('plays a reference tone when picking a note in the editor', async ({ page }) => {
    await spyReferenceTone(page)
    await page.goto(APP_URL)

    const stringButton = page.getByRole('button', { name: '1 E2' })
    await stringButton.click()
    await waitForTonePlays(page, 1)

    await stringButton.click()
    await expect(page.getByRole('heading', { name: 'Choose note' })).toBeVisible()

    const beforePick = await referenceTonePlayCount(page)
    await page.getByRole('button', { name: 'A', exact: true }).click()
    await waitForTonePlays(page, beforePick + 1)
  })

  test('keeps listening UI stable while a reference tone plays', async ({ page }) => {
    await spyReferenceTone(page)
    await stubMicrophone(page, 110)
    await page.goto(APP_URL)

    await page.getByRole('button', { name: 'Start tuning' }).click()
    await expect(page.getByText('String 2 (A2): in tune')).toBeVisible()

    await page.getByRole('button', { name: '2 A2' }).click()
    await waitForTonePlays(page, 1)

    await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible()

    await expect(page.getByText(/String 2 \(A2\):|Play/)).toBeVisible()
  })
})
