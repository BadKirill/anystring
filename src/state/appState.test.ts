import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { pitchToFrequency } from '../core/music'
import { PRESET_TUNINGS } from '../core/tunings'
import { memoryStorage } from '../test/memoryStorage'
import { useTunerState } from './appState'

const { usePitch } = vi.hoisted(() => ({
  usePitch: vi.fn(),
}))

vi.mock('../audio/usePitch', () => ({
  usePitch,
}))

describe('useTunerState', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage())
    vi.stubGlobal('sessionStorage', memoryStorage())
    usePitch.mockReturnValue({
      status: 'idle',
      error: null,
      frequency: null,
      clarity: null,
      start: vi.fn(),
      stop: vi.fn(),
    })
  })

  it('starts on the strings screen with the default tuning', () => {
    const { result } = renderHook(() => useTunerState())
    expect(result.current.screen).toBe('strings')
    expect(result.current.tuning.id).toBe('guitar-standard')
    expect(result.current.analysis).toBeNull()
  })

  it('routes auto, manual, and chromatic analysis', () => {
    const e2 = pitchToFrequency({ note: 'E', octave: 2 })
    usePitch.mockReturnValue({
      status: 'listening',
      error: null,
      frequency: e2,
      clarity: 0.95,
      start: vi.fn(),
      stop: vi.fn(),
    })
    const { result } = renderHook(() => useTunerState())
    expect(result.current.analysis?.kind).toBe('string')
    expect(
      result.current.analysis && 'stringIndex' in result.current.analysis
        ? result.current.analysis.stringIndex
        : null,
    ).toBe(0)
    act(() => {
      result.current.selectString(1)
    })
    expect(result.current.manualStringIndex).toBe(1)
    expect(
      result.current.analysis && 'stringIndex' in result.current.analysis
        ? result.current.analysis.stringIndex
        : null,
    ).toBe(1)
    act(() => {
      result.current.setScreen('chromatic')
    })
    expect(result.current.screen).toBe('chromatic')
    expect(result.current.analysis?.kind).toBe('chromatic')
  })

  it('turns an edited string into a custom draft and keeps the name on a second edit', () => {
    const { result } = renderHook(() => useTunerState())
    act(() => {
      result.current.editString(0, { note: 'D', octave: 2 })
    })
    expect(result.current.tuning.id).toBe('custom-draft')
    expect(result.current.tuning.name).toBe('Custom')
    act(() => {
      result.current.editString(0, { note: 'D', octave: 2 })
    })
    expect(result.current.tuning.id).toBe('custom-draft')
    act(() => {
      result.current.editString(1, { note: 'G', octave: 2 })
    })
    expect(result.current.tuning.name).toBe('Custom')
    const drop = PRESET_TUNINGS.find((tuning) => tuning.id === 'guitar-drop-d')
    if (!drop) {
      throw new Error('guitar-drop-d preset is missing')
    }
    act(() => {
      result.current.selectTuning(drop)
    })
    expect(result.current.tuning.id).toBe('guitar-drop-d')
    expect(result.current.manualStringIndex).toBeNull()
  })
})
