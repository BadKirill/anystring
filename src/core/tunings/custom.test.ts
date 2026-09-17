import { describe, expect, it } from 'vitest'

import {
  appearsInPicker,
  belongsInMyTunings,
  isDraftTuning,
  isSavedCustomTuning,
  isUnmodifiedPreset,
} from './custom'
import { PRESET_TUNINGS } from './presets'
import type { Tuning } from './types'

const SAVED: Tuning = {
  id: 'custom-1',
  name: 'Test',
  instrument: 'guitar',
  strings: [{ pitch: { note: 'E', octave: 2 } }],
}

function firstPreset(): Tuning {
  const preset = PRESET_TUNINGS[0]
  if (!preset) {
    throw new Error('expected at least one preset tuning')
  }
  return preset
}

describe('isSavedCustomTuning', () => {
  it('accepts saved custom ids and rejects presets and draft', () => {
    const preset = firstPreset()
    expect(isSavedCustomTuning(SAVED)).toBe(true)
    expect(isSavedCustomTuning({ ...SAVED, id: 'user-tuning-42' })).toBe(true)
    expect(isSavedCustomTuning(preset)).toBe(false)
    expect(
      isSavedCustomTuning({
        ...SAVED,
        id: 'custom-draft',
      }),
    ).toBe(false)
  })
})

describe('belongsInMyTunings', () => {
  it('includes saved customs and edited presets but not drafts or bare presets', () => {
    const preset = firstPreset()
    expect(belongsInMyTunings(SAVED)).toBe(true)
    expect(belongsInMyTunings(preset)).toBe(false)
    expect(isUnmodifiedPreset(preset)).toBe(true)
    expect(belongsInMyTunings({ ...preset, name: 'Test23' })).toBe(true)
    expect(
      belongsInMyTunings({
        ...SAVED,
        id: 'custom-draft',
        name: 'Custom',
      }),
    ).toBe(false)
    expect(isDraftTuning({ ...SAVED, id: 'custom-draft' })).toBe(true)
    expect(appearsInPicker(SAVED)).toBe(true)
    expect(appearsInPicker(preset)).toBe(false)
  })

  it('treats a pitch change as a modified preset', () => {
    const preset = firstPreset()
    const first = preset.strings[0]
    if (!first) {
      throw new Error('expected preset strings')
    }
    const edited: Tuning = {
      ...preset,
      strings: [{ pitch: { note: 'C', octave: 0 } }, ...preset.strings.slice(1)],
    }
    expect(first.pitch.note).not.toBe('C')
    expect(isUnmodifiedPreset(edited)).toBe(false)
    expect(belongsInMyTunings(edited)).toBe(true)
  })
})
