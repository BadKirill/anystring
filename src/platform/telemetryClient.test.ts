import { describe, expect, it, vi } from 'vitest'

import { hashClientUser, postTelemetry, TELEMETRY_ENDPOINT } from './telemetryClient'

describe('hashClientUser', () => {
  it('returns a stable hex digest', async () => {
    const first = await hashClientUser('device-1')
    const second = await hashClientUser('device-1')
    expect(first).toMatch(/^[0-9a-f]{64}$/)
    expect(first).toBe(second)
    expect(await hashClientUser('device-2')).not.toBe(first)
  })
})

describe('postTelemetry', () => {
  it('posts hashed bodies to TelemetryDeck and swallows network errors', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)
    await postTelemetry([
      {
        appID: 'app-1',
        clientUser: 'device-1',
        sessionID: 'session-1',
        type: 'app.open',
        payload: { platform: 'web' },
        isTestMode: true,
      },
    ])
    expect(fetchMock).toHaveBeenCalledOnce()
    const posted = fetchMock.mock.calls[0]?.[1] as { method?: string; body?: string }
    expect(fetchMock.mock.calls[0]?.[0]).toBe(TELEMETRY_ENDPOINT)
    expect(posted.method).toBe('POST')
    const body = JSON.parse(posted.body ?? '[]') as {
      clientUser: string
      type: string
    }[]
    expect(body[0]?.type).toBe('app.open')
    expect(body[0]?.clientUser).toMatch(/^[0-9a-f]{64}$/)
    expect(body[0]?.clientUser).not.toBe('device-1')

    fetchMock.mockRejectedValueOnce(new Error('offline'))
    await expect(
      postTelemetry([
        {
          appID: 'app-1',
          clientUser: 'device-1',
          sessionID: 'session-1',
          type: 'mic.start',
          payload: {},
          isTestMode: false,
        },
      ]),
    ).resolves.toBeUndefined()
  })

  it('EC-telemetry-empty-id: does nothing when the app id is blank', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await postTelemetry([
      {
        appID: '',
        clientUser: 'device-1',
        sessionID: 's',
        type: 'app.open',
        payload: {},
        isTestMode: true,
      },
    ])
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
