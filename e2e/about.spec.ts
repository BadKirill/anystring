import { readFileSync } from 'node:fs'

import { expect, test } from '@playwright/test'

import { parseReleaseVersion } from '../scripts/appReleaseVersion.ts'
import { APP_URL } from './helpers'

const release = parseReleaseVersion(readFileSync('package.json', 'utf8'))

test('About sheet shows the installed marketing version and build', async ({ page }) => {
  await page.goto(APP_URL)
  await page.getByRole('button', { name: 'About' }).click()
  await expect(page.getByRole('heading', { name: 'About Anystring' })).toBeVisible()
  await expect(
    page.getByText(`Version ${release.version} (${String(release.buildNumber)})`, {
      exact: true,
    }),
  ).toBeVisible()
})
