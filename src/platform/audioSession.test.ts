import { describe, expect, it } from 'vitest'

import { reassertAudioSession, setAudioSessionMode } from './audioSession'

describe('audioSession', () => {
  it('maps capture and playback onto the web audio session type', () => {
    const session = { type: 'auto' as const }
    Object.defineProperty(navigator, 'audioSession', {
      configurable: true,
      value: session,
    })
    setAudioSessionMode('capture')
    expect(session.type).toBe('play-and-record')
    setAudioSessionMode('playback')
    expect(session.type).toBe('playback')
    reassertAudioSession()
    expect(session.type).toBe('playback')
  })

  it('no-ops when the browser has no audioSession', () => {
    Object.defineProperty(navigator, 'audioSession', {
      configurable: true,
      value: undefined,
    })
    expect(() => {
      setAudioSessionMode('capture')
      reassertAudioSession()
    }).not.toThrow()
  })
})
