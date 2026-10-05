import { INITIAL_REVIEW_STATE, isReviewState, type ReviewState } from '../core/review'
import { needsPrivacyNotice, readPrivacyAccepted } from './privacyNotice'

const ENABLED_KEY = 'anystring.v2.analyticsEnabled'
const CLIENT_KEY = 'anystring.v2.analyticsClientId'
const REVIEW_KEY = 'anystring.v2.reviewState'

function readRaw(key: string): unknown {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as unknown) : null
  } catch {
    return null
  }
}

function writeRaw(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    return
  }
}

export function analyticsPreferenceOn(): boolean {
  return localStorage.getItem(ENABLED_KEY) !== '0'
}

export function isAnalyticsEnabled(): boolean {
  return analyticsPreferenceOn() && !needsPrivacyNotice(readPrivacyAccepted())
}

export function setAnalyticsEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(ENABLED_KEY, enabled ? '1' : '0')
  } catch {
    return
  }
}

export function analyticsClientId(createId: () => string): string {
  const stored = localStorage.getItem(CLIENT_KEY)
  if (stored !== null && stored !== '') {
    return stored
  }
  const created = createId()
  try {
    localStorage.setItem(CLIENT_KEY, created)
  } catch {
    return created
  }
  return created
}

export function readReviewState(): ReviewState {
  const parsed = readRaw(REVIEW_KEY)
  return isReviewState(parsed) ? parsed : INITIAL_REVIEW_STATE
}

export function writeReviewState(state: ReviewState): void {
  writeRaw(REVIEW_KEY, state)
}
