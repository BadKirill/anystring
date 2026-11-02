import { expect, test } from '@playwright/test'

import { APP_URL, setTestTone, stubMicrophone, stubMicrophoneDenied } from './helpers'

const A2_HZ = 110
const A2_FLAT_HZ = 106
const A2_SHARP_HZ = 114

const E2_HZ = 82.41
const E2_FLAT_HZ = 80
const E2_SHARP_HZ = 85

test.describe('tuning with the microphone', () => {
  test('detects an in-tune string, then flat and sharp deviations', async ({ page }) => {
    await stubMicrophone(page, A2_HZ)
    await page.goto(APP_URL)

    await expect(page.getByText('String 2 (A2): in tune')).toBeVisible()
    await expect(
      page.getByRole('button', { name: '2 A2, in tune', exact: true }),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible()

    await setTestTone(page, A2_FLAT_HZ)
    await expect(page.getByText('String 2 (A2): too low — tighten')).toBeVisible()
    await expect(
      page.getByRole('button', { name: '2 A2, in tune', exact: true }),
    ).toBeVisible()

    await setTestTone(page, A2_SHARP_HZ)
    await expect(page.getByText('String 2 (A2): too high — loosen')).toBeVisible()
  })

  test('tunes a low E2 string through flat, in-tune, and sharp', async ({ page }) => {
    await stubMicrophone(page, E2_FLAT_HZ)
    await page.goto(APP_URL)

    await page.getByRole('button', { name: '1 E2' }).click()
    await expect(page.getByText('String 1 (E2): too low — tighten')).toBeVisible()

    await setTestTone(page, E2_HZ)
    await expect(page.getByText('String 1 (E2): in tune')).toBeVisible()

    await setTestTone(page, E2_SHARP_HZ)
    await expect(page.getByText('String 1 (E2): too high — loosen')).toBeVisible()
  })

  test('targets only the manually selected string', async ({ page }) => {
    await stubMicrophone(page, A2_HZ)
    await page.goto(APP_URL)

    await page.getByRole('button', { name: '1 E2' }).click()
    await expect(page.getByText('String 1 (E2): too high — loosen')).toBeVisible()
  })

  test('shows chromatic nearest-note guidance for the same tone', async ({ page }) => {
    const chromaticFlatHz = 107.5
    const chromaticSharpHz = 112.5

    await stubMicrophone(page, A2_HZ)
    await page.goto(APP_URL)

    await page.getByRole('tab', { name: 'Chromatic' }).click()
    await expect(page.getByText('A2 · centered')).toBeVisible()
    await expect(page.getByRole('button', { name: '1 E2' })).toHaveCount(0)

    await setTestTone(page, chromaticFlatHz)
    await expect(page.getByText(/A2 · .+ · flat — tune up/)).toBeVisible()

    await setTestTone(page, chromaticSharpHz)
    await expect(page.getByText(/A2 · .+ · sharp — tune down/)).toBeVisible()
  })

  test('clears the in-tune check when the preset changes', async ({ page }) => {
    await stubMicrophone(page, A2_HZ)
    await page.goto(APP_URL)
    await expect(
      page.getByRole('button', { name: '2 A2, in tune', exact: true }),
    ).toBeVisible()

    await page.getByRole('button', { name: 'Standard E' }).click()
    await page.getByRole('button', { name: 'D2 A2 D3 G3 B3 E4' }).click()

    await expect(page.getByRole('button', { name: 'Drop D' })).toBeVisible()
    await expect(page.getByRole('button', { name: '2 A2', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: '1 D2', exact: true })).toBeVisible()
    await expect(
      page.getByRole('button', { name: '2 A2, in tune', exact: true }),
    ).toHaveCount(0)
  })

  test('shows an error when microphone access is denied', async ({ page }) => {
    await stubMicrophoneDenied(page)
    await page.goto(APP_URL)

    await expect(page.getByText(/Microphone access denied/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start tuning' })).toBeVisible()
  })
})
