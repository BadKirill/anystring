import { toSignal, type AnalyticsEvent } from '../core/analytics'
import type { TelemetryBody } from '../platform/telemetryClient'

export interface AnalyticsSink {
  track: (event: AnalyticsEvent) => void
}

export interface AnalyticsSinkOptions {
  appId: string
  enabled: () => boolean
  clientId: () => string
  sessionId: string
  testMode: boolean
  post: (bodies: TelemetryBody[]) => Promise<void>
}

export function createAnalyticsSink(options: AnalyticsSinkOptions): AnalyticsSink {
  return {
    track(event: AnalyticsEvent) {
      if (!options.enabled() || options.appId === '') {
        return
      }
      const signal = toSignal(event)
      void options.post([
        {
          appID: options.appId,
          clientUser: options.clientId(),
          sessionID: options.sessionId,
          type: signal.type,
          payload: signal.payload,
          isTestMode: options.testMode,
        },
      ])
    },
  }
}
