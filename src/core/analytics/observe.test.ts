import { describe, expect, it } from 'vitest'

import { observeTuner, tunerSnapshot, type TunerSnapshot } from './observe'

const idle: TunerSnapshot = {
  screen: 'strings',
  instrument: 'guitar',
  preset: 'guitar-standard',
  stringCount: 6,
  tuningId: 'guitar-standard',
  listening: false,
  failure: null,
  inTune: false,
}

describe('observeTuner', () => {
  it('opens with a screen view and later records a successful session', () => {
    const first = observeTuner({ snapshot: null, session: null }, idle, 0)
    expect(first.events).toEqual([{ type: 'screen.view', screen: 'strings' }])

    const listening = observeTuner(
      { snapshot: idle, session: null },
      { ...idle, listening: true },
      1000,
    )
    expect(listening.events).toEqual([{ type: 'mic.start' }])
    expect(listening.session).toEqual({ startedAt: 1000, inTune: false })

    const inTune = observeTuner(
      { snapshot: { ...idle, listening: true }, session: listening.session },
      { ...idle, listening: true, inTune: true },
      2000,
    )
    const ended = observeTuner(
      { snapshot: { ...idle, listening: true, inTune: true }, session: inTune.session },
      idle,
      5000,
    )
    expect(ended.events).toEqual([
      {
        type: 'session.end',
        screen: 'strings',
        instrument: 'guitar',
        length: 'under-10s',
        inTune: true,
      },
    ])
    expect(ended.session).toBeNull()
  })

  it('emits select, save, screen, and mic error without sending names', () => {
    const selected = observeTuner(
      { snapshot: idle, session: null },
      { ...idle, tuningId: 'guitar-drop-d', preset: 'guitar-drop-d' },
      0,
    )
    expect(selected.events).toEqual([
      { type: 'tuning.select', instrument: 'guitar', preset: 'guitar-drop-d' },
    ])

    const drafting: TunerSnapshot = {
      ...idle,
      tuningId: 'custom-draft',
      preset: 'draft',
    }
    const saved = observeTuner(
      { snapshot: drafting, session: null },
      {
        ...idle,
        tuningId: 'custom-1',
        preset: 'custom',
        stringCount: 4,
        instrument: 'bass',
      },
      0,
    )
    expect(saved.events).toEqual([
      { type: 'tuning.select', instrument: 'bass', preset: 'custom' },
      { type: 'tuning.save', instrument: 'bass', strings: 4 },
    ])
    expect(JSON.stringify(saved.events)).not.toContain('Demiurge')

    const screen = observeTuner(
      { snapshot: idle, session: null },
      { ...idle, screen: 'chromatic' },
      0,
    )
    expect(screen.events).toEqual([{ type: 'screen.view', screen: 'chromatic' }])

    const failed = observeTuner(
      { snapshot: idle, session: null },
      { ...idle, failure: 'permission-denied' },
      0,
    )
    expect(failed.events).toEqual([{ type: 'mic.error', failure: 'permission-denied' }])
  })
})

describe('tunerSnapshot', () => {
  it('labels a custom tuning without using its name', () => {
    const snapshot = tunerSnapshot({
      screen: 'strings',
      tuning: {
        id: 'custom-1',
        name: 'Demiurge',
        instrument: 'bass',
        strings: [{ pitch: { note: 'F', octave: 1 } }],
      },
      listening: false,
      failure: null,
      inTune: false,
    })
    expect(snapshot.preset).toBe('custom')
    expect(snapshot.tuningId).toBe('custom-1')
  })
})
