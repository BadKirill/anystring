import { describe, expect, it, vi } from 'vitest'

import {
  formatAppVersion,
  installedAppVersion,
  pickAppVersion,
  readNativeAppVersion,
} from './appVersion.ts'
import { isNativePlatform } from './runtime.ts'

const getInfo = vi.hoisted(() => vi.fn())

vi.mock('@capacitor/app', () => ({
  App: { getInfo },
}))

vi.mock('./runtime', () => ({
  isNativePlatform: vi.fn(() => false),
}))

const bundled = { version: '1.0.0', build: '1' }

describe('formatAppVersion', () => {
  it('shows marketing version and store build number', () => {
    expect(formatAppVersion({ version: '1.0.3', build: '8' })).toBe('1.0.3 (8)')
  })
})

describe('pickAppVersion', () => {
  it('uses native metadata when the installed binary reports a version', () => {
    expect(pickAppVersion(bundled, { version: '1.0.3', build: '8' })).toEqual({
      version: '1.0.3',
      build: '8',
    })
  })

  it('falls back to the bundled version on web', () => {
    expect(pickAppVersion(bundled, null)).toEqual(bundled)
  })

  it('falls back when native metadata is empty', () => {
    expect(pickAppVersion(bundled, { version: '', build: '8' })).toEqual(bundled)
    expect(pickAppVersion(bundled, { version: '1.0.3', build: '' })).toEqual(bundled)
  })
})

describe('readNativeAppVersion', () => {
  it('returns native info when the OS query succeeds', async () => {
    await expect(
      readNativeAppVersion(() => Promise.resolve({ version: '1.0.3', build: '8' })),
    ).resolves.toEqual({ version: '1.0.3', build: '8' })
  })

  it('returns null when the OS query fails', async () => {
    await expect(
      readNativeAppVersion(() => Promise.reject(new Error('unavailable'))),
    ).resolves.toBeNull()
  })
})

describe('installedAppVersion', () => {
  it('uses the Vite-bundled version on web', async () => {
    vi.mocked(isNativePlatform).mockReturnValue(false)
    await expect(installedAppVersion()).resolves.toEqual({
      version: __APP_VERSION__,
      build: __APP_BUILD__,
    })
  })

  it('uses OS bundle metadata on a native install', async () => {
    vi.mocked(isNativePlatform).mockReturnValue(true)
    getInfo.mockResolvedValue({
      name: 'Anystring',
      id: 'com.badkirill.anystring',
      build: '8',
      version: '1.0.3',
    })
    await expect(installedAppVersion()).resolves.toEqual({
      version: '1.0.3',
      build: '8',
    })
  })
})
