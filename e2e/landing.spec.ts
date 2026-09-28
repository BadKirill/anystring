import { expect, test } from '@playwright/test'

test('landing names fretted and bowed instruments and opens the tuner', async ({
  page,
}) => {
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: 'Any tuning. Every string.' }),
  ).toBeVisible()
  await expect(
    page.getByText('Guitar, bass, ukulele, and bowed strings', { exact: true }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Open tuner' }).click()
  await expect(page.getByRole('button', { name: 'Standard E' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Start tuning' })).toBeVisible()
  await page.getByRole('button', { name: 'Standard E' }).click()
  await expect(page.getByRole('button', { name: 'Ukulele' })).toBeVisible()
})
