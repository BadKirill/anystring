import { beforeEach, describe, expect, it, vi } from 'vitest'

import { INITIAL_REVIEW_STATE, markReviewRequested } from '../core/review'
import { memoryStorage } from '../test/memoryStorage'
import { acceptPrivacyNotice } from './privacyNotice'
import {
  analyticsClientId,
  isAnalyticsEnabled,
  readReviewState,
  setAnalyticsEnabled,
  writeReviewState,
} from './telemetryStore'

describe('telemetryStore', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage())
  })

  it('treats a missing opt-out as enabled after the policy is accepted', () => {
    acceptPrivacyNotice()
    expect(isAnalyticsEnabled()).toBe(true)
  })

  it('EC-telemetry-optout: persists the opt-out across reads', () => {
    acceptPrivacyNotice()
    setAnalyticsEnabled(false)
    expect(isAnalyticsEnabled()).toBe(false)
    setAnalyticsEnabled(true)
    expect(isAnalyticsEnabled()).toBe(true)
  })

  it('reuses one anonymous client id', () => {
    const first = analyticsClientId(() => 'id-a')
    const second = analyticsClientId(() => 'id-b')
    expect(first).toBe('id-a')
    expect(second).toBe('id-a')
  })

  it('EC-review-corrupt: a broken review record reads as the initial state', () => {
    localStorage.setItem('anystring.v2.reviewState', '{')
    expect(readReviewState()).toEqual(INITIAL_REVIEW_STATE)
    localStorage.setItem(
      'anystring.v2.reviewState',
      JSON.stringify({ successfulSessions: -1 }),
    )
    expect(readReviewState()).toEqual(INITIAL_REVIEW_STATE)
  })

  it('round-trips a requested review state', () => {
    const next = markReviewRequested(INITIAL_REVIEW_STATE, 100, '1.4.0')
    writeReviewState(next)
    expect(readReviewState()).toEqual(next)
  })

  it('EC-telemetry-quota: a full store does not throw', () => {
    vi.stubGlobal('localStorage', {
      ...memoryStorage(),
      setItem: () => {
        throw new DOMException('The quota has been exceeded.', 'QuotaExceededError')
      },
    })
    expect(() => {
      setAnalyticsEnabled(false)
      writeReviewState(INITIAL_REVIEW_STATE)
      analyticsClientId(() => 'id-a')
    }).not.toThrow()
  })
})
