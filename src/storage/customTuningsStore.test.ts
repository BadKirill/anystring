import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PRESET_TUNINGS, type Tuning } from '../core/tunings'
import {
  deleteCustomTuning,
  mergePickerTunings,
  readActiveTuning,
  readCustomTunings,
  renameCustomTuning,
  saveCustomTuning,
  upsertInList,
} from './customTuningsStore'

function memoryStorage(): Storage {
  const data = new Map<string, string>()
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value),
    removeItem: (key: string) => data.delete(key),
    clear: () => {
      data.clear()
    },
    key: () => null,
    get length() {
      return data.size
    },
  }
}

const TUNING: Tuning = {
  id: 'custom-1',
  name: 'Demiurge',
  instrument: 'bass',
  strings: [
    { pitch: { note: 'F', octave: 1 } },
    { pitch: { note: 'A#', octave: 1 } },
    { pitch: { note: 'D#', octave: 2 } },
    { pitch: { note: 'G#', octave: 2 } },
  ],
}

describe('customTuningsStore', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage())
    vi.stubGlobal('sessionStorage', memoryStorage())
  })

  it('starts empty', () => {
    expect(readCustomTunings()).toEqual([])
  })

  it('saves and lists a tuning', () => {
    saveCustomTuning(TUNING)
    expect(readCustomTunings()).toEqual([TUNING])
  })

  it('replaces a tuning saved with the same id', () => {
    saveCustomTuning(TUNING)
    saveCustomTuning({ ...TUNING, name: 'Renamed' })
    expect(readCustomTunings()).toHaveLength(1)
    expect(readCustomTunings()[0]?.name).toBe('Renamed')
  })

  it('removes a tuning by id', () => {
    saveCustomTuning(TUNING)
    deleteCustomTuning(TUNING.id)
    expect(readCustomTunings()).toEqual([])
  })

  it('recovers from corrupted storage', () => {
    localStorage.setItem('anystring.v2.customTunings', 'not json {')
    expect(readCustomTunings()).toEqual([])
  })

  it('loads legacy array-only storage', () => {
    localStorage.setItem('anytune.customTunings', JSON.stringify([TUNING]))
    expect(readCustomTunings()).toEqual([TUNING])
  })

  it('does not save built-in presets as custom tunings', () => {
    const preset = PRESET_TUNINGS[0]
    expect(preset).toBeDefined()
    if (preset) {
      saveCustomTuning(preset)
    }
    expect(readCustomTunings()).toEqual([])
  })

  it('restores the last active custom tuning', () => {
    saveCustomTuning(TUNING)
    expect(readActiveTuning()).toEqual(TUNING)
  })

  it('falls back to session storage when local storage is empty', () => {
    sessionStorage.setItem(
      'anystring.v2.customTunings.session',
      JSON.stringify({ v: 2, tunings: [TUNING] }),
    )
    expect(readCustomTunings()).toEqual([TUNING])
  })

  it('normalizes string octaves when loading legacy storage', () => {
    localStorage.setItem(
      'anytune.customTunings',
      JSON.stringify([
        {
          ...TUNING,
          strings: [{ pitch: { note: 'F', octave: '1' } }],
        },
      ]),
    )
    expect(readCustomTunings()).toEqual([
      {
        ...TUNING,
        strings: [{ pitch: { note: 'F', octave: 1 } }],
      },
    ])
  })

  it('restores last active tuning from legacy session storage', () => {
    sessionStorage.setItem('anytune.lastActiveTuning.session', JSON.stringify(TUNING))
    expect(readActiveTuning()).toEqual(TUNING)
  })

  it('includes the active saved tuning when storage is stale', () => {
    expect(mergePickerTunings([], TUNING)).toEqual([TUNING])
  })

  it('migrates renamed legacy presets into my tunings', () => {
    const preset = PRESET_TUNINGS[0]
    expect(preset).toBeDefined()
    if (!preset) {
      return
    }
    const renamed = { ...preset, name: 'Test123' }
    sessionStorage.setItem('anytune.lastActiveTuning.session', JSON.stringify(renamed))
    const active = readActiveTuning()
    expect(active?.name).toBe('Test123')
    expect(active?.id.startsWith('custom-')).toBe(true)
    if (active) {
      expect(mergePickerTunings([], active)).toHaveLength(1)
    }
  })

  it('renames a saved tuning', () => {
    saveCustomTuning(TUNING)
    const updated = renameCustomTuning(TUNING.id, 'New name')
    expect(updated?.name).toBe('New name')
    expect(readCustomTunings()[0]?.name).toBe('New name')
  })

  it('dedupes identical tunings saved with different ids', () => {
    saveCustomTuning(TUNING)
    saveCustomTuning({ ...TUNING, id: 'custom-2' })
    expect(readCustomTunings()).toHaveLength(1)
    expect(mergePickerTunings(readCustomTunings(), TUNING)).toHaveLength(1)
  })

  it('loads legacy user-owned ids that do not use the custom- prefix', () => {
    const legacy: Tuning = { ...TUNING, id: 'user-tuning-42' }
    localStorage.setItem('anytune.customTunings', JSON.stringify([legacy]))
    expect(readCustomTunings()).toEqual([legacy])
    expect(mergePickerTunings(readCustomTunings(), legacy)).toEqual([legacy])
  })

  it('lists the active tuning when only the active key is set', () => {
    localStorage.setItem('anystring.v2.activeTuning', JSON.stringify(TUNING))
    expect(readCustomTunings()).toEqual([TUNING])
    expect(mergePickerTunings(readCustomTunings(), TUNING)).toEqual([TUNING])
  })

  it('adopts tunings saved before the Anystring rename', () => {
    localStorage.setItem(
      'anytune.v2.customTunings',
      JSON.stringify({ v: 2, tunings: [TUNING] }),
    )
    expect(readCustomTunings()).toEqual([TUNING])
    expect(localStorage.getItem('anystring.v2.customTunings')).toContain(TUNING.name)
  })

  it('adopts the active tuning saved before the Anystring rename', () => {
    localStorage.setItem('anytune.v2.activeTuning', JSON.stringify(TUNING))
    expect(readActiveTuning()).toEqual(TUNING)
  })

  it('persists the live selection before building the picker list', () => {
    const live: Tuning = { ...TUNING, id: 'custom-live', name: 'Testing' }
    expect(mergePickerTunings([], live)).toEqual([live])
    expect(readCustomTunings()).toEqual([live])
  })

  it('upserts into an in-memory list', () => {
    expect(upsertInList([], TUNING)).toEqual([TUNING])
    expect(upsertInList([TUNING], { ...TUNING, name: 'Renamed' })).toEqual([
      { ...TUNING, name: 'Renamed' },
    ])
  })
})
