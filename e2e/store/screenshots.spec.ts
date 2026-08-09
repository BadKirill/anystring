import { expect, test, type Page } from '@playwright/test'
import path from 'node:path'

import { APP_URL, setTestTone, stubMicrophone } from '../helpers'

const A2_HZ = 110
const A2_FLAT_HZ = 106
const OUT_ROOT = path.join(process.cwd(), 'store', 'screenshots')

function platformDir(): 'ios' | 'android' {
  const name = test.info().project.name
  return name.startsWith('ios') ? 'ios' : 'android'
}

async function shot(page: Page, basename: string): Promise<void> {
  const dir = path.join(OUT_ROOT, platformDir())
  await page.screenshot({
    path: path.join(dir, `${basename}.png`),
    fullPage: false,
  })
}

async function openApp(page: Page, hz = A2_HZ): Promise<void> {
  await stubMicrophone(page, hz)
  await page.goto(APP_URL)
  await expect(page.getByRole('heading', { name: 'Anystring' })).toBeVisible()
}

test.describe('store screenshots', () => {
  test('01 idle hero', async ({ page }) => {
    await openApp(page)
    await expect(page.getByRole('button', { name: 'Start tuning' })).toBeVisible()
    await shot(page, '01-idle')
  })

  test('02 strings in tune', async ({ page }) => {
    await openApp(page, A2_HZ)
    await page.getByRole('button', { name: 'Start tuning' }).click()
    await expect(page.getByText('String 2 (A2): in tune')).toBeVisible()
    await shot(page, '02-strings-in-tune')
  })

  test('03 strings flat', async ({ page }) => {
    await openApp(page, A2_FLAT_HZ)
    await page.getByRole('button', { name: 'Start tuning' }).click()
    await expect(page.getByText('String 2 (A2): too low — tighten')).toBeVisible()
    await shot(page, '03-strings-flat')
  })

  test('04 chromatic', async ({ page }) => {
    await openApp(page, A2_HZ)
    await page.getByRole('tab', { name: 'Chromatic' }).click()
    await page.getByRole('button', { name: 'Start tuning' }).click()
    await expect(page.getByText('A2 · centered')).toBeVisible()
    await shot(page, '04-chromatic')
  })

  test('05 preset picker', async ({ page }) => {
    await openApp(page)
    await page.getByRole('button', { name: 'Standard E' }).click()
    await expect(
      page.getByRole('heading', { name: 'Tunings', exact: true }),
    ).toBeVisible()
    await shot(page, '05-presets')
  })

  test('06 note picker', async ({ page }) => {
    await openApp(page)
    const stringButton = page.getByRole('button', { name: '1 E2' })
    await stringButton.click()
    await stringButton.click()
    await expect(page.getByRole('heading', { name: 'Choose note' })).toBeVisible()
    await shot(page, '06-note-picker')
  })

  test('07 strings sharp after retune', async ({ page }) => {
    await openApp(page, A2_HZ)
    await page.getByRole('button', { name: 'Start tuning' }).click()
    await expect(page.getByText('String 2 (A2): in tune')).toBeVisible()
    await setTestTone(page, 114)
    await expect(page.getByText('String 2 (A2): too high — loosen')).toBeVisible()
    await shot(page, '07-strings-sharp')
  })
})
