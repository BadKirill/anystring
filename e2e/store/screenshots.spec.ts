import { expect, test, type Page } from '@playwright/test'
import path from 'node:path'

import { APP_URL, stubMicrophone } from '../helpers'
import {
  STORE_CAPTURE_CSS,
  assertStorePngSize,
  captureFramedScreenshot,
  storePlatformFromProject,
  type MarketingCopy,
} from './marketingFrame'

const A2_HZ = 110
const A2_FLAT_HZ = 106
const G3_HZ = 195.997717
const D2_HZ = 73.416191
const CHROMATIC_FLAT_HZ = 108.9
const OUT_ROOT = path.join(process.cwd(), 'store', 'screenshots')
const SETTLE_MS = 700

function platformFromTest(): ReturnType<typeof storePlatformFromProject> {
  return storePlatformFromProject(test.info().project.name)
}

async function settle(): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, SETTLE_MS)
  })
}

async function shot(page: Page, basename: string, copy: MarketingCopy): Promise<void> {
  await settle()
  const platform = platformFromTest()
  const outputPath = path.join(OUT_ROOT, platform, `${basename}.png`)
  await captureFramedScreenshot(page, { copy, platform, outputPath })
  await assertStorePngSize(outputPath, platform)
}

async function openApp(page: Page, hz = A2_HZ): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await stubMicrophone(page, hz)
  await page.addInitScript(() => {
    localStorage.setItem('anystring.installHintDismissed', '1')
  })
  await page.goto(APP_URL)
  await expect(page.getByRole('heading', { name: 'Anystring' })).toBeVisible()
  await page.addStyleTag({ content: STORE_CAPTURE_CSS })
}

async function startTuning(page: Page, expected: string | RegExp): Promise<void> {
  await page.getByRole('button', { name: 'Start tuning' }).click()
  await expect(page.getByText(expected)).toBeVisible()
}

async function openTunings(page: Page, headerName: string): Promise<void> {
  await page.getByRole('button', { name: headerName }).click()
  await expect(page.getByRole('heading', { name: 'Tunings', exact: true })).toBeVisible()
}

test.describe('store screenshots', () => {
  test('01 auto-detect in tune', async ({ page }) => {
    await openApp(page, G3_HZ)
    await startTuning(page, 'String 4 (G3): in tune')
    await shot(page, '01-play-a-string', {
      eyebrow: 'Guitar tuner',
      headline: 'Play a string.\nIt knows.',
    })
  })

  test('02 chromatic cents', async ({ page }) => {
    await openApp(page, CHROMATIC_FLAT_HZ)
    await page.getByRole('tab', { name: 'Chromatic' }).click()
    await startTuning(page, /A2 · .+ · flat — tune up/)
    await shot(page, '02-cents', {
      eyebrow: 'Cent accurate',
      headline: 'Know exactly\nhow far off',
    })
  })

  test('03 presets guitar bass ukulele', async ({ page }) => {
    await openApp(page)
    await openTunings(page, 'Standard E')
    await page.getByRole('button', { name: 'Bass' }).click()
    await page.getByRole('button', { name: 'Ukulele' }).click()
    await page.getByRole('button', { name: 'Guitar' }).click()
    await page.addStyleTag({
      content: `
        .sheet-scroll > h3:first-of-type,
        .sheet-scroll > p.hint { display: none !important; }
      `,
    })
    await expect(page.getByRole('button', { name: /^Low G G3/ })).toBeVisible()
    await expect(
      page.getByRole('button', { name: /^Standard \(4-string\)/ }),
    ).toBeVisible()
    await shot(page, '03-presets', {
      eyebrow: 'Guitar, bass, ukulele',
      headline: 'Every instrument.\nNo extra paywall.',
    })
  })

  test('04 note picker reference tone', async ({ page }) => {
    await openApp(page)
    const stringButton = page.getByRole('button', { name: '1 E2' })
    await stringButton.click()
    await stringButton.click()
    await expect(page.getByRole('heading', { name: 'Choose note' })).toBeVisible()
    await page.getByRole('button', { name: 'D', exact: true }).click()
    await shot(page, '04-note-picker', {
      eyebrow: 'Any note, any string',
      headline: 'Change a string.\nHear it.',
    })
  })

  test('05 my tunings', async ({ page }) => {
    await openApp(page)
    const stringButton = page.getByRole('button', { name: '1 E2' })
    await stringButton.click()
    await stringButton.click()
    await page.getByRole('button', { name: 'G#', exact: true }).click()
    await page.getByRole('button', { name: '1', exact: true }).click()
    await page.getByRole('button', { name: 'Done' }).click()
    await openTunings(page, 'Custom')
    await page.getByRole('textbox', { name: 'Tuning name' }).fill('Drop G#')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByRole('button', { name: /^Drop G# G#1/ })).toBeVisible()
    await shot(page, '05-my-tunings', {
      eyebrow: 'My tunings',
      headline: 'Build your own\ntunings',
    })
  })

  test('06 tighten or loosen', async ({ page }) => {
    await openApp(page, A2_FLAT_HZ)
    await startTuning(page, 'String 2 (A2): too low — tighten')
    await shot(page, '06-direction', {
      eyebrow: 'Tighten or loosen',
      headline: 'See which way\nto turn',
    })
  })

  test('07 drop D alternate tunings', async ({ page }) => {
    await openApp(page, D2_HZ)
    await openTunings(page, 'Standard E')
    await page.getByRole('button', { name: /^Drop D D2/ }).click()
    await expect(page.getByRole('button', { name: 'Drop D' })).toBeVisible()
    await startTuning(page, 'String 1 (D2): in tune')
    await shot(page, '07-drop-d', {
      eyebrow: 'Drop D to Low G',
      headline: 'Alternate tunings,\nincluded',
    })
  })
})
