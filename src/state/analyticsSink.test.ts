import { describe, expect, it, vi } from 'vitest'

import { createAnalyticsSink } from './analyticsSink'

describe('createAnalyticsSink', () => {
  it('forwards a mapped signal when analytics is on', () => {
    const post = vi.fn().mockResolvedValue(undefined)
    const sink = createAnalyticsSink({
      appId: 'app-1',
      enabled: () => true,
      clientId: () => 'device-1',
      sessionId: 'session-1',
      testMode: true,
      post,
    })
    sink.track({ type: 'mic.start' })
    expect(post).toHaveBeenCalledWith([
      {
        appID: 'app-1',
        clientUser: 'device-1',
        sessionID: 'session-1',
        type: 'mic.start',
        payload: {},
        isTestMode: true,
      },
    ])
  })

  it('EC-telemetry-optout-sink: drops events when the user opted out', () => {
    const post = vi.fn()
    const sink = createAnalyticsSink({
      appId: 'app-1',
      enabled: () => false,
      clientId: () => 'device-1',
      sessionId: 'session-1',
      testMode: false,
      post,
    })
    sink.track({ type: 'app.open', platform: 'web', version: '1.4.0', language: 'en' })
    expect(post).not.toHaveBeenCalled()
  })
})
