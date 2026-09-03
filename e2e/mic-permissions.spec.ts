import { expect, test } from '@playwright/test'

import {
  APP_URL,
  stubMicrophone,
  stubMicrophoneDenied,
  stubMicrophoneMissing,
  stubMicrophoneUnavailable,
} from './helpers'

test.describe('microphone permission and hardware errors', () => {
  test('shows denied copy and allows retry after Start', async ({ page }) => {
    await stubMicrophoneDenied(page)
    await page.goto(APP_URL)

    await page.getByRole('button', { name: 'Start tuning' }).click()
    await expect(
      page.getByText('Microphone access denied. Allow it in settings and retry.'),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start tuning' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Stop' })).toHaveCount(0)

    await page.getByRole('button', { name: 'Start tuning' }).click()
    await expect(
      page.getByText('Microphone access denied. Allow it in settings and retry.'),
    ).toBeVisible()
  })

  test('shows missing-microphone copy when no device is found', async ({ page }) => {
    await stubMicrophoneMissing(page)
    await page.goto(APP_URL)

    await page.getByRole('button', { name: 'Start tuning' }).click()
    await expect(page.getByText('No microphone found on this device.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start tuning' })).toBeVisible()
  })

  test('shows unavailable copy for other getUserMedia failures', async ({ page }) => {
    await stubMicrophoneUnavailable(page)
    await page.goto(APP_URL)

    await page.getByRole('button', { name: 'Start tuning' }).click()
    await expect(page.getByText('Microphone is unavailable.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start tuning' })).toBeVisible()
  })

  test('recovers to listening when the mic becomes available on retry', async ({
    page,
  }) => {
    await stubMicrophoneDenied(page)
    await page.goto(APP_URL)
    await page.getByRole('button', { name: 'Start tuning' }).click()
    await expect(page.getByText(/Microphone access denied/)).toBeVisible()

    await stubMicrophone(page, 110)
    await page.reload()
    await page.getByRole('button', { name: 'Start tuning' }).click()
    await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible()
    await expect(page.getByText('String 2 (A2): in tune')).toBeVisible()
  })
})
