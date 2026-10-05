import { describe, expect, it } from 'vitest'

import {
  INITIAL_REVIEW_STATE,
  isReviewState,
  markReviewRequested,
  promptAfterSuccess,
  recordSuccessfulSession,
  REVIEW_AFTER_SESSIONS,
  REVIEW_COOLDOWN_MS,
  shouldRequestReview,
  type ReviewState,
} from './policy'

const DAY_MS = 24 * 60 * 60 * 1000

function afterSessions(
  count: number,
  from: ReviewState = INITIAL_REVIEW_STATE,
): ReviewState {
  let state = from
  for (let i = 0; i < count; i += 1) {
    state = recordSuccessfulSession(state)
  }
  return state
}

describe('shouldRequestReview', () => {
  it('EC-review-third: asks on the third successful session and not before', () => {
    expect(shouldRequestReview(afterSessions(2), 1000, '1.4.0')).toBe(false)
    expect(shouldRequestReview(afterSessions(REVIEW_AFTER_SESSIONS), 1000, '1.4.0')).toBe(
      true,
    )
  })

  it('EC-review-same-version: never asks twice for one app version', () => {
    const asked = markReviewRequested(afterSessions(3), 1000, '1.4.0')
    const later = afterSessions(10, asked)
    expect(shouldRequestReview(later, 1000 + 365 * DAY_MS, '1.4.0')).toBe(false)
  })

  it('EC-review-cooldown: a new version asks only after 90 days', () => {
    const asked = markReviewRequested(afterSessions(3), 1000, '1.4.0')
    const ready = afterSessions(3, asked)
    expect(shouldRequestReview(ready, 1000 + REVIEW_COOLDOWN_MS - 1, '1.5.0')).toBe(false)
    expect(shouldRequestReview(ready, 1000 + REVIEW_COOLDOWN_MS, '1.5.0')).toBe(true)
  })

  it('promptAfterSuccess marks the request only when the policy fires', () => {
    const early = promptAfterSuccess(INITIAL_REVIEW_STATE, 1000, '1.4.0', 'web')
    expect(early.prompt).toBe('none')
    expect(early.state.successfulSessions).toBe(1)
    const ready = promptAfterSuccess(afterSessions(2), 1000, '1.4.0', 'native')
    expect(ready.prompt).toBe('native')
    expect(ready.state.successfulSessions).toBe(0)
  })

  it('needs fresh sessions after a request', () => {
    const asked = markReviewRequested(afterSessions(5), 1000, '1.4.0')
    expect(asked.successfulSessions).toBe(0)
    expect(
      shouldRequestReview(afterSessions(2, asked), 1000 + REVIEW_COOLDOWN_MS, '1.5.0'),
    ).toBe(false)
  })
})

describe('isReviewState', () => {
  it('accepts the initial state and a requested state', () => {
    expect(isReviewState(INITIAL_REVIEW_STATE)).toBe(true)
    expect(isReviewState(markReviewRequested(INITIAL_REVIEW_STATE, 5, '1.4.0'))).toBe(
      true,
    )
  })

  it('EC-review-corrupt: rejects malformed values', () => {
    expect(isReviewState(null)).toBe(false)
    expect(isReviewState({ successfulSessions: '3', lastRequest: null })).toBe(false)
    expect(isReviewState({ successfulSessions: -1, lastRequest: null })).toBe(false)
    expect(
      isReviewState({ successfulSessions: 1, lastRequest: { at: 'x', version: 1 } }),
    ).toBe(false)
    expect(isReviewState({ successfulSessions: 1 })).toBe(false)
  })
})
