import { expect, test } from '@playwright/test'

import {
  APP_URL,
  referenceTonePlayCount,
  setTestTone,
  simulateBackground,
  spyReferenceTone,
  stubLongBackground,
  stubMicrophone,
} from './helpers'

const TEN_MINUTES_MS = 10 * 60 * 1000

test.describe('recovery after a long background', () => {
  test('still plays reference tones when the old context cannot resume', async ({
    page,
  }) => {
    await spyReferenceTone(page)
    await stubLongBackground(page)
    await page.goto(APP_URL)

    const stringButton = page.getByRole('button', { name: '1 E2' })
    await stringButton.click()
    await expect.poll(async () => referenceTonePlayCount(page)).toBeGreaterThan(0)

    await simulateBackground(page, TEN_MINUTES_MS)

    const beforeTap = await referenceTonePlayCount(page)
    await stringButton.click()
    await expect
      .poll(async () => referenceTonePlayCount(page), { timeout: 15000 })
      .toBeGreaterThan(beforeTap)
  })

  test('keeps detecting pitch after the capture graph is lost', async ({ page }) => {
    await stubMicrophone(page, 82.41)
    await stubLongBackground(page)
    await page.goto(APP_URL)

    await page.getByRole('button', { name: 'Start tuning' }).click()
    await expect(page.getByText('String 1 (E2): in tune')).toBeVisible()

    await simulateBackground(page, TEN_MINUTES_MS)

    await expect
      .poll(
        async () => {
          await setTestTone(page, 110)
          return page.getByText('String 2 (A2): in tune').isVisible()
        },
        { timeout: 20000 },
      )
      .toBe(true)
  })
})
