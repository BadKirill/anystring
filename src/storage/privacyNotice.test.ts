import { beforeEach, describe, expect, it, vi } from 'vitest'

import { memoryStorage } from '../test/memoryStorage'
import {
  acceptPrivacyNotice,
  needsPrivacyNotice,
  PRIVACY_POLICY_VERSION,
  readPrivacyAccepted,
} from './privacyNotice'
import { isAnalyticsEnabled, setAnalyticsEnabled } from './telemetryStore'

describe('needsPrivacyNotice', () => {
  it('EC-privacy-missing: a new install has not accepted the policy', () => {
    expect(needsPrivacyNotice(null)).toBe(true)
    expect(needsPrivacyNotice('')).toBe(true)
  })

  it('EC-privacy-stale: an older acceptance is not the current policy', () => {
    expect(needsPrivacyNotice('2026-08-05')).toBe(true)
  })

  it('EC-privacy-current: the current policy version hides the notice', () => {
    expect(needsPrivacyNotice(PRIVACY_POLICY_VERSION)).toBe(false)
  })
})

describe('acceptPrivacyNotice', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage())
  })

  it('stores the current policy version', () => {
    expect(acceptPrivacyNotice()).toBe(true)
    expect(readPrivacyAccepted()).toBe(PRIVACY_POLICY_VERSION)
    expect(needsPrivacyNotice(readPrivacyAccepted())).toBe(false)
  })

  it('EC-privacy-quota: a full store does not throw and the notice stays due', () => {
    vi.stubGlobal('localStorage', {
      ...memoryStorage(),
      setItem: () => {
        throw new DOMException('The quota has been exceeded.', 'QuotaExceededError')
      },
    })
    expect(acceptPrivacyNotice()).toBe(false)
    expect(needsPrivacyNotice(readPrivacyAccepted())).toBe(true)
  })

  it('EC-privacy-before-consent: statistics stay off until this policy is accepted', () => {
    setAnalyticsEnabled(true)
    expect(isAnalyticsEnabled()).toBe(false)
    acceptPrivacyNotice()
    expect(isAnalyticsEnabled()).toBe(true)
    setAnalyticsEnabled(false)
    expect(isAnalyticsEnabled()).toBe(false)
  })
})
