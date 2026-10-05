import { DRAFT_TUNING_ID, isSavedCustomTuning } from '../tunings/custom'
import type { Instrument, Tuning } from '../tunings/types'

export type AnalyticsPlatform = 'web' | 'ios' | 'android'

export type MicFailure = 'permission-denied' | 'no-microphone' | 'unavailable'

export type ScreenName = 'strings' | 'chromatic'

export type SessionLength = 'under-10s' | 'under-1m' | 'under-5m' | 'over-5m'

export type AnalyticsEvent =
  | { type: 'app.open'; platform: AnalyticsPlatform; version: string; language: string }
  | { type: 'screen.view'; screen: ScreenName }
  | { type: 'mic.start' }
  | { type: 'mic.error'; failure: MicFailure }
  | { type: 'tuning.select'; instrument: Instrument; preset: string }
  | { type: 'tuning.save'; instrument: Instrument; strings: number }
  | {
      type: 'session.end'
      screen: ScreenName
      instrument: Instrument
      length: SessionLength
      inTune: boolean
    }
  | { type: 'review.request'; platform: AnalyticsPlatform }

export interface Signal {
  type: AnalyticsEvent['type']
  payload: Record<string, string>
}

export function toSignal(event: AnalyticsEvent): Signal {
  const { type, ...rest } = event
  const payload: Record<string, string> = {}
  for (const [key, value] of Object.entries(rest)) {
    payload[key] = String(value)
  }
  return { type, payload }
}

export function presetLabel(tuning: Tuning): string {
  if (tuning.id === DRAFT_TUNING_ID) {
    return 'draft'
  }
  return isSavedCustomTuning(tuning) ? 'custom' : tuning.id
}

const LENGTH_BUCKETS: readonly [number, SessionLength][] = [
  [10, 'under-10s'],
  [60, 'under-1m'],
  [300, 'under-5m'],
]

export function sessionLength(seconds: number): SessionLength {
  const bucket = LENGTH_BUCKETS.find(([limit]) => seconds < limit)
  return bucket ? bucket[1] : 'over-5m'
}

export function languageTag(locale: string): string {
  const language = locale.trim().split(/[-_]/)[0]?.toLowerCase() ?? ''
  return language === '' ? 'unknown' : language
}
