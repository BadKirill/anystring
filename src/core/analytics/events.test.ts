import { describe, expect, it } from 'vitest'

import { DRAFT_TUNING_ID } from '../tunings/custom'
import { PRESET_TUNINGS } from '../tunings/presets'
import type { Tuning } from '../tunings/types'
import { languageTag, presetLabel, sessionLength, toSignal } from './events'

function preset(): Tuning {
  const first = PRESET_TUNINGS[0]
  if (!first) {
    throw new Error('expected a preset')
  }
  return first
}

describe('toSignal', () => {
  it('keeps the event type and stringifies every other field', () => {
    expect(
      toSignal({
        type: 'session.end',
        screen: 'strings',
        instrument: 'bass',
        length: 'under-1m',
        inTune: true,
      }),
    ).toEqual({
      type: 'session.end',
      payload: {
        screen: 'strings',
        instrument: 'bass',
        length: 'under-1m',
        inTune: 'true',
      },
    })
  })

  it('sends an empty payload for a bare event', () => {
    expect(toSignal({ type: 'mic.start' })).toEqual({ type: 'mic.start', payload: {} })
  })
})

describe('presetLabel', () => {
  it('reports a built-in preset by id', () => {
    expect(presetLabel(preset())).toBe(preset().id)
  })

  it('EC-telemetry-custom-name: a saved custom tuning is just "custom", never its name', () => {
    const custom: Tuning = { ...preset(), id: 'custom-1700000000000', name: 'Demiurge' }
    const label = presetLabel(custom)
    expect(label).toBe('custom')
    expect(
      JSON.stringify(
        toSignal({ type: 'tuning.select', instrument: 'bass', preset: label }),
      ),
    ).not.toContain('Demiurge')
  })

  it('reports an unsaved draft as "draft"', () => {
    expect(presetLabel({ ...preset(), id: DRAFT_TUNING_ID, name: 'Custom' })).toBe(
      'draft',
    )
  })
})

describe('sessionLength', () => {
  it('EC-telemetry-length-bounds: buckets close on the lower edge', () => {
    expect(sessionLength(0)).toBe('under-10s')
    expect(sessionLength(9.9)).toBe('under-10s')
    expect(sessionLength(10)).toBe('under-1m')
    expect(sessionLength(59.9)).toBe('under-1m')
    expect(sessionLength(60)).toBe('under-5m')
    expect(sessionLength(299)).toBe('under-5m')
    expect(sessionLength(300)).toBe('over-5m')
  })
})

describe('languageTag', () => {
  it('keeps only the lower-cased language subtag', () => {
    expect(languageTag('ru-RU')).toBe('ru')
    expect(languageTag('EN')).toBe('en')
    expect(languageTag('pt_BR')).toBe('pt')
  })

  it('EC-telemetry-language-empty: an empty locale is "unknown"', () => {
    expect(languageTag('')).toBe('unknown')
    expect(languageTag('   ')).toBe('unknown')
  })
})
