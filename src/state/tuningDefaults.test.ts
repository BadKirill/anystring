import { describe, expect, it } from 'vitest'

import { PRESET_TUNINGS } from '../core/tunings'
import { defaultTuning } from './tuningDefaults'

describe('defaultTuning', () => {
  it('returns the standard guitar preset', () => {
    const tuning = defaultTuning()
    expect(tuning.id).toBe('guitar-standard')
    expect(tuning).toEqual(PRESET_TUNINGS.find((entry) => entry.id === 'guitar-standard'))
  })

  it('falls back to the first preset if the default id is missing', () => {
    const first = PRESET_TUNINGS[0]
    if (!first) {
      throw new Error('expected at least one preset tuning')
    }
    const original = [...PRESET_TUNINGS]
    PRESET_TUNINGS.length = 0
    PRESET_TUNINGS.push({ ...first, id: 'other' })
    try {
      expect(defaultTuning().id).toBe('other')
    } finally {
      PRESET_TUNINGS.length = 0
      PRESET_TUNINGS.push(...original)
    }
  })

  it('throws when no presets exist', () => {
    const original = [...PRESET_TUNINGS]
    PRESET_TUNINGS.length = 0
    try {
      expect(() => defaultTuning()).toThrow('No preset tunings defined')
    } finally {
      PRESET_TUNINGS.push(...original)
    }
  })
})
