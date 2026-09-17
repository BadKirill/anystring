import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Tuning } from '../core/tunings'
import { memoryStorage } from '../test/memoryStorage'
import { saveCustomTuning } from '../storage/customTuningsStore'
import { useSavedTunings } from './useSavedTunings'

const TUNING: Tuning = {
  id: 'custom-1',
  name: 'Demiurge',
  instrument: 'bass',
  strings: [{ pitch: { note: 'F', octave: 1 } }],
}

describe('useSavedTunings', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage())
    vi.stubGlobal('sessionStorage', memoryStorage())
  })

  it('saves, renames, refreshes, and deletes custom tunings', () => {
    let tuning: Tuning = {
      id: 'custom-draft',
      name: 'Custom',
      instrument: 'bass',
      strings: TUNING.strings,
    }
    const setTuning = (update: Tuning | ((prev: Tuning) => Tuning)) => {
      tuning = typeof update === 'function' ? update(tuning) : update
    }
    const { result, rerender } = renderHook(() => useSavedTunings(tuning, setTuning))
    act(() => {
      result.current.saveDraft('  ')
    })
    expect(tuning.id).toBe('custom-draft')
    act(() => {
      result.current.saveDraft('Demiurge')
    })
    expect(tuning.name).toBe('Demiurge')
    expect(result.current.pickerTunings.some((entry) => entry.name === 'Demiurge')).toBe(
      true,
    )
    rerender()
    act(() => {
      result.current.renameCustom(tuning.id, 'Renamed')
    })
    expect(tuning.name).toBe('Renamed')
    act(() => {
      result.current.refreshMyTunings()
    })
    expect(result.current.tuningsRevision).toBeGreaterThan(0)
    const id = tuning.id
    act(() => {
      result.current.deleteCustom(id)
    })
    expect(tuning.id).toBe('guitar-standard')
  })

  it('merges a live selection that is only in memory', () => {
    saveCustomTuning(TUNING)
    let tuning = TUNING
    const { result } = renderHook(() =>
      useSavedTunings(tuning, (update) => {
        tuning = typeof update === 'function' ? update(tuning) : update
      }),
    )
    expect(result.current.pickerTunings).toEqual([TUNING])
  })
})
