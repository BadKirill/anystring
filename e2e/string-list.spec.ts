import { expect, test, type Locator } from '@playwright/test'

import { APP_URL, EIGHT_STRING_TUNING, seedActiveTuning } from './helpers'

async function itemTops(locator: Locator): Promise<number[]> {
  return locator.evaluateAll((nodes) =>
    nodes.map((node) => Math.round(node.getBoundingClientRect().top)),
  )
}

async function listOverflows(locator: Locator): Promise<boolean> {
  return locator.evaluate((node) => node.scrollWidth > node.clientWidth + 1)
}

async function isFullyInRow(row: Locator, name: string): Promise<boolean> {
  return row
    .page()
    .getByRole('button', { name })
    .evaluate((button) => {
      const rail = button.closest('.string-list')
      if (!(rail instanceof HTMLElement)) {
        return false
      }
      const buttonBox = button.getBoundingClientRect()
      const railBox = rail.getBoundingClientRect()
      return buttonBox.left >= railBox.left - 1 && buttonBox.right <= railBox.right + 1
    })
}

test.describe('string row overflow', () => {
  test('keeps six strings in one unscrollable row', async ({ page }) => {
    await page.goto(APP_URL)
    const row = page.locator('.string-list')
    await expect(page.locator('.string-item')).toHaveCount(6)
    expect(new Set(await itemTops(page.locator('.string-item'))).size).toBe(1)
    expect(await listOverflows(row)).toBe(false)
    await expect(page.getByRole('slider', { name: 'Scroll strings' })).toHaveCount(0)
  })

  test('keeps eight strings on one row and scrolls the rest into view', async ({
    page,
  }) => {
    await seedActiveTuning(page, EIGHT_STRING_TUNING)
    await page.goto(APP_URL)

    const row = page.locator('.string-list')
    await expect(page.locator('.string-item')).toHaveCount(8)
    expect(new Set(await itemTops(page.locator('.string-item'))).size).toBe(1)
    expect(await listOverflows(row)).toBe(true)
    await expect(page.getByRole('button', { name: '1 F#1' })).toBeVisible()
    expect(await isFullyInRow(row, '8 E4')).toBe(false)

    const slider = page.getByRole('slider', { name: 'Scroll strings' })
    await expect(slider).toBeVisible()

    const max = await slider.getAttribute('max')
    expect(Number(max)).toBeGreaterThan(0)
    await slider.fill(max ?? '0')
    await expect.poll(async () => isFullyInRow(row, '8 E4')).toBe(true)
  })
})
