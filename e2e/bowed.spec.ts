import { expect, test, type Page } from '@playwright/test'

import { APP_URL, clearTuningStorage } from './helpers'

function instrumentCard(page: Page, name: string) {
  return page.locator('.instrument-group').filter({
    has: page.getByRole('button', { name, exact: true }),
  })
}

test('picker offers violin, viola, cello, and double bass tunings', async ({ page }) => {
  await page.goto(APP_URL)
  await clearTuningStorage(page)
  await page.reload()

  await page.getByRole('button', { name: 'Standard E' }).click()
  for (const name of ['Violin', 'Viola', 'Cello', 'Double bass']) {
    const header = page.getByRole('button', { name, exact: true })
    await header.scrollIntoViewIfNeeded()
    await expect(header).toBeVisible()
  }

  const violin = instrumentCard(page, 'Violin')
  await page.getByRole('button', { name: 'Violin', exact: true }).click()
  await violin.getByRole('button', { name: /^Standard G3/ }).click()
  await expect(page.getByRole('button', { name: '1 G3' })).toBeVisible()
  await expect(page.getByRole('button', { name: '2 D4' })).toBeVisible()
  await expect(page.getByRole('button', { name: '3 A4' })).toBeVisible()
  await expect(page.getByRole('button', { name: '4 E5' })).toBeVisible()

  await page.locator('.tuning-picker-button').click()
  const cello = instrumentCard(page, 'Cello')
  await page.getByRole('button', { name: 'Cello', exact: true }).click()
  await expect(cello.getByRole('button', { name: /^Bach Suite V C2/ })).toBeVisible()
  const bass = instrumentCard(page, 'Double bass')
  await page.getByRole('button', { name: 'Double bass', exact: true }).click()
  await expect(bass.getByRole('button', { name: /^Fifths C1/ })).toBeVisible()
  await expect(bass.getByRole('button', { name: /^Solo F#1/ })).toBeVisible()
})
