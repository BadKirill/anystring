import { useEffect, useMemo, useRef, useState } from 'react'

import {
  languageTag,
  observeTuner,
  tunerSnapshot,
  type AnalyticsEvent,
  type AnalyticsPlatform,
  type ObserveState,
} from '../core/analytics'
import { promptAfterSuccess } from '../core/review'
import { analyticsPlatform, isNativePlatform } from '../platform/runtime'
import { requestStoreReview } from '../platform/reviewPrompt'
import { postTelemetry } from '../platform/telemetryClient'
import {
  analyticsClientId,
  isAnalyticsEnabled,
  readReviewState,
  writeReviewState,
} from '../storage/telemetryStore'

import { createAnalyticsSink } from './analyticsSink'
import type { TunerState } from './appState'

export interface UsageTelemetry {
  webReviewVisible: boolean
  dismissWebReview: () => void
}

export interface UsageTelemetryOptions {
  track?: (event: AnalyticsEvent) => void
  now?: () => number
  version?: string
  platform?: AnalyticsPlatform
  isNative?: boolean
  requestReview?: () => Promise<void>
}

interface ReviewContext {
  now: number
  version: string
  platform: AnalyticsPlatform
  isNative: boolean
  requestReview: () => Promise<void>
  track: (event: AnalyticsEvent) => void
  showWeb: () => void
}

function defaultTrack(): (event: AnalyticsEvent) => void {
  return createAnalyticsSink({
    appId: __TELEMETRY_APP_ID__,
    enabled: isAnalyticsEnabled,
    clientId: () => analyticsClientId(() => crypto.randomUUID()),
    sessionId: crypto.randomUUID(),
    testMode: import.meta.env.DEV,
    post: postTelemetry,
  }).track
}

function applyReviewPrompt(inTune: boolean, context: ReviewContext): void {
  if (!inTune) {
    return
  }
  const result = promptAfterSuccess(
    readReviewState(),
    context.now,
    context.version,
    context.isNative ? 'native' : 'web',
  )
  writeReviewState(result.state)
  if (result.prompt === 'none') {
    return
  }
  context.track({ type: 'review.request', platform: context.platform })
  if (result.prompt === 'web') {
    context.showWeb()
    return
  }
  void context.requestReview()
}

function emitUsage(
  state: TunerState,
  previous: ObserveState,
  track: (event: AnalyticsEvent) => void,
  context: ReviewContext,
): ObserveState {
  const result = observeTuner(
    previous,
    tunerSnapshot({
      screen: state.screen,
      tuning: state.tuning,
      listening: state.pitch.status === 'listening',
      failure: state.pitch.status === 'error' ? state.pitch.error : null,
      inTune: state.analysis?.direction === 'in-tune',
    }),
    context.now,
  )
  result.events.forEach(track)
  applyReviewPrompt(result.ended?.inTune === true, context)
  return { snapshot: result.snapshot, session: result.session }
}

export function useUsageTelemetry(
  state: TunerState,
  options: UsageTelemetryOptions = {},
): UsageTelemetry {
  const track = useMemo(() => options.track ?? defaultTrack(), [options.track])
  const previous = useRef<ObserveState>({ snapshot: null, session: null })
  const opened = useRef(false)
  const [webReviewVisible, setWebReviewVisible] = useState(false)
  const now = options.now ?? Date.now
  const version = options.version ?? __APP_VERSION__
  const platform = options.platform ?? analyticsPlatform()
  const native = options.isNative ?? isNativePlatform()
  const requestReview = options.requestReview ?? requestStoreReview

  useEffect(() => {
    if (!opened.current) {
      opened.current = true
      track({
        type: 'app.open',
        platform,
        version,
        language: languageTag(navigator.language),
      })
    }
    previous.current = emitUsage(state, previous.current, track, {
      now: now(),
      version,
      platform,
      isNative: native,
      requestReview,
      track,
      showWeb: () => {
        setWebReviewVisible(true)
      },
    })
  }, [state, track, now, version, platform, native, requestReview])

  return {
    webReviewVisible,
    dismissWebReview: () => {
      setWebReviewVisible(false)
    },
  }
}
