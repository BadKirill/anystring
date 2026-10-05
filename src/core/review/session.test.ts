import { describe, expect, it } from 'vitest'

import { stepSession } from './session'

describe('stepSession', () => {
  it('stays idle while nothing is listening', () => {
    expect(stepSession(null, { listening: false, inTune: false, now: 10 })).toEqual({
      session: null,
      ended: null,
    })
  })

  it('opens a session when listening starts', () => {
    expect(stepSession(null, { listening: true, inTune: false, now: 10 })).toEqual({
      session: { startedAt: 10, inTune: false },
      ended: null,
    })
  })

  it('remembers in-tune once seen, even if the needle drifts off again', () => {
    const opened = stepSession(null, { listening: true, inTune: false, now: 0 }).session
    const seen = stepSession(opened, { listening: true, inTune: true, now: 1000 }).session
    const drifted = stepSession(seen, {
      listening: true,
      inTune: false,
      now: 2000,
    }).session
    expect(drifted).toEqual({ startedAt: 0, inTune: true })
  })

  it('reports the length and success when listening stops', () => {
    const open = { startedAt: 0, inTune: true }
    expect(stepSession(open, { listening: false, inTune: false, now: 12500 })).toEqual({
      session: null,
      ended: { seconds: 12.5, inTune: true },
    })
  })

  it('EC-session-no-intune: a session that never centred is not a success', () => {
    const open = { startedAt: 0, inTune: false }
    expect(
      stepSession(open, { listening: false, inTune: false, now: 5000 }).ended,
    ).toEqual({
      seconds: 5,
      inTune: false,
    })
  })
})
