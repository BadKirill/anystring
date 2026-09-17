import { expect, test, type Page } from '@playwright/test'

import { APP_URL, clearTuningStorage } from './helpers'

test('picker empty My tunings copy stays above the instrument headers', async ({
  page,
}) => {
  await page.goto(APP_URL)
  await clearTuningStorage(page)
  await page.reload()

  await page.getByRole('button', { name: 'Standard E' }).click()
  const picker = page.locator('.sheet-scroll')
  const hint = picker.getByText(/No saved tunings yet/)
  const guitar = page.getByRole('button', { name: 'Guitar' })
  await expect(hint).toBeVisible()
  await expect(guitar).toBeVisible()

  const hintBox = await hint.boundingBox()
  const guitarBox = await guitar.boundingBox()
  expect(hintBox).not.toBeNull()
  expect(guitarBox).not.toBeNull()
  if (hintBox === null || guitarBox === null) {
    return
  }
  const textBottom = await hint.evaluate((el) => {
    const range = document.createRange()
    range.selectNodeContents(el)
    return range.getBoundingClientRect().bottom
  })
  expect(textBottom).toBeLessThanOrEqual(guitarBox.y + 1)
  expect(await hint.evaluate((el) => el.scrollHeight <= el.clientHeight + 1)).toBe(true)
})

function instrumentCard(page: Page, name: string) {
  return page.locator('.instrument-group').filter({
    has: page.getByRole('button', { name, exact: true }),
  })
}

test('picker opens instrument presets inside that instrument card', async ({ page }) => {
  await page.goto(APP_URL)
  await clearTuningStorage(page)
  await page.reload()

  await page.getByRole('button', { name: 'Standard E' }).click()
  await expect(page.getByRole('heading', { name: 'Tunings', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Guitar' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Bass' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Ukulele' })).toBeVisible()

  const guitarCard = instrumentCard(page, 'Guitar')
  const ukeCard = instrumentCard(page, 'Ukulele')
  const drop = guitarCard.getByRole('button', { name: /^Drop D D2/ })
  await expect(guitarCard).toHaveCount(1)
  await expect(drop).toBeVisible()
  await expect(ukeCard.getByRole('button', { name: /^Low G G3/ })).toHaveCount(0)

  await expect
    .poll(async () => {
      const guitarBox = await page.getByRole('button', { name: 'Guitar' }).boundingBox()
      const bassBox = await page.getByRole('button', { name: 'Bass' }).boundingBox()
      const ukeBox = await page.getByRole('button', { name: 'Ukulele' }).boundingBox()
      const dropBox = await drop.boundingBox()
      const guitarCardBox = await guitarCard.boundingBox()
      if (
        guitarBox === null ||
        bassBox === null ||
        ukeBox === null ||
        dropBox === null ||
        guitarCardBox === null
      ) {
        return false
      }
      return (
        guitarBox.y < dropBox.y &&
        dropBox.y + dropBox.height <= guitarCardBox.y + guitarCardBox.height + 1 &&
        dropBox.y + dropBox.height <= bassBox.y &&
        bassBox.y < ukeBox.y &&
        dropBox.x > guitarCardBox.x + 4
      )
    })
    .toBe(true)

  await page.getByRole('button', { name: 'Ukulele' }).click()
  await expect(guitarCard.getByRole('button', { name: /^Drop D D2/ })).toHaveCount(0)
  await expect(ukeCard.getByRole('button', { name: /^Low G G3/ })).toBeVisible()
  await expect(ukeCard.getByRole('button', { name: /^Baritone D3/ })).toBeVisible()

  await page.getByRole('button', { name: /^Low G G3/ }).click()
  await expect(page.getByRole('button', { name: 'Low G' })).toBeVisible()
  await expect(page.getByRole('button', { name: '1 G3' })).toBeVisible()
  await expect(page.getByRole('button', { name: '2 C4' })).toBeVisible()
  await expect(page.getByRole('button', { name: '3 E4' })).toBeVisible()
  await expect(page.getByRole('button', { name: '4 A4' })).toBeVisible()
})
