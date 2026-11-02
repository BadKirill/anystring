import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { pitchToFrequency, type Pitch } from '../core/music'
import { PRESET_TUNINGS, type Tuning } from '../core/tunings'
import { pulseHaptic } from '../platform/hapticPulse'
import { memoryStorage } from '../test/memoryStorage'
import { useTunerState } from './appState'

const { usePitch } = vi.hoisted(() => ({
  usePitch: vi.fn(),
}))

vi.mock('../audio/usePitch', () => ({
  usePitch,
}))

vi.mock('../platform/hapticPulse', () => ({
  pulseHaptic: vi.fn(),
}))

function hear(frequency: number | null): void {
  usePitch.mockReturnValue({
    status: 'listening',
    error: null,
    frequency,
    clarity: 0.95,
    start: vi.fn(),
    stop: vi.fn(),
  })
}

function detuned(pitch: Pitch, cents: number): number {
  return pitchToFrequency(pitch) * 2 ** (cents / 1200)
}

const E2: Pitch = { note: 'E', octave: 2 }
const A2: Pitch = { note: 'A', octave: 2 }

function expectStringReading(
  analysis: ReturnType<typeof useTunerState>['analysis'],
  direction: 'in-tune' | 'tighten' | 'loosen',
  stringIndex: number,
): void {
  expect(analysis?.kind).toBe('string')
  if (analysis?.kind !== 'string') {
    return
  }
  expect(analysis.stringIndex).toBe(stringIndex)
  expect(analysis.direction).toBe(direction)
  if (direction === 'in-tune') {
    expect(Math.abs(analysis.cents)).toBeLessThanOrEqual(5)
    return
  }
  expect(Math.abs(analysis.cents)).toBeGreaterThan(5)
}

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
    vi.mocked(pulseHaptic).mockClear()
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

  it('checks the displayed in-tune string and clears that check when the pitch changes', async () => {
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
    await waitFor(() => {
      expect(result.current.checkedStrings).toEqual([0])
    })
    act(() => {
      result.current.editString(0, { note: 'F', octave: 2 })
    })
    await waitFor(() => {
      expect(result.current.checkedStrings).toEqual([])
    })
    expect(pulseHaptic).toHaveBeenCalledTimes(1)
  })

  it('EC-lock-cents checks inside five cents and keeps the check past five', async () => {
    hear(detuned(E2, -6))
    const flat = renderHook(() => useTunerState())
    await act(async () => undefined)
    expectStringReading(flat.result.current.analysis, 'tighten', 0)
    expect(flat.result.current.checkedStrings).toEqual([])
    expect(pulseHaptic).not.toHaveBeenCalled()
    flat.unmount()

    hear(detuned(E2, 6))
    const sharp = renderHook(() => useTunerState())
    await act(async () => undefined)
    expectStringReading(sharp.result.current.analysis, 'loosen', 0)
    expect(sharp.result.current.checkedStrings).toEqual([])
    expect(pulseHaptic).not.toHaveBeenCalled()
    sharp.unmount()

    hear(detuned(E2, -4))
    const { result, rerender } = renderHook(() => useTunerState())
    await waitFor(() => {
      expect(result.current.checkedStrings).toEqual([0])
    })
    expectStringReading(result.current.analysis, 'in-tune', 0)
    expect(pulseHaptic).toHaveBeenCalledTimes(1)

    hear(detuned(E2, 40))
    rerender()
    await act(async () => undefined)
    expectStringReading(result.current.analysis, 'loosen', 0)
    expect(result.current.checkedStrings).toEqual([0])
    expect(pulseHaptic).toHaveBeenCalledTimes(1)

    hear(detuned(E2, 4))
    rerender()
    await waitFor(() => {
      expect(pulseHaptic).toHaveBeenCalledTimes(2)
    })
    expectStringReading(result.current.analysis, 'in-tune', 0)
    expect(result.current.checkedStrings).toEqual([0])
  })

  it('EC-lock-manual checks only the selected string', async () => {
    hear(pitchToFrequency(E2))
    const { result, rerender } = renderHook(() => useTunerState())
    await waitFor(() => {
      expect(result.current.checkedStrings).toEqual([0])
    })

    act(() => {
      result.current.selectString(1)
    })
    await act(async () => undefined)
    expect(result.current.manualStringIndex).toBe(1)
    expectStringReading(result.current.analysis, 'tighten', 1)
    expect(result.current.checkedStrings).toEqual([0])
    expect(pulseHaptic).toHaveBeenCalledTimes(1)

    hear(pitchToFrequency(A2))
    rerender()
    expectStringReading(result.current.analysis, 'in-tune', 1)
    await waitFor(() => {
      expect(result.current.checkedStrings).toEqual([0, 1])
    })
    expect(pulseHaptic).toHaveBeenCalledTimes(2)
  })

  it('EC-lock-preset clears checks when the preset changes even while the new string is in tune', async () => {
    hear(pitchToFrequency(A2))
    const { result } = renderHook(() => useTunerState())
    await waitFor(() => {
      expect(result.current.checkedStrings).toEqual([1])
    })
    const drop = PRESET_TUNINGS.find((tuning) => tuning.id === 'guitar-drop-d')
    if (!drop) {
      throw new Error('guitar-drop-d preset is missing')
    }
    act(() => {
      result.current.selectTuning(drop)
    })
    await act(async () => undefined)
    expect(result.current.tuning.id).toBe('guitar-drop-d')
    expectStringReading(result.current.analysis, 'in-tune', 1)
    expect(result.current.checkedStrings).toEqual([])
    expect(pulseHaptic).toHaveBeenCalledTimes(1)
  })

  it('EC-lock-same-note keeps the check when a string is saved at the same pitch', async () => {
    hear(pitchToFrequency(E2))
    const { result } = renderHook(() => useTunerState())
    await waitFor(() => {
      expect(result.current.checkedStrings).toEqual([0])
    })
    act(() => {
      result.current.editString(0, E2)
    })
    await act(async () => undefined)
    expect(result.current.tuning.id).toBe('guitar-standard')
    expect(result.current.checkedStrings).toEqual([0])
    expect(pulseHaptic).toHaveBeenCalledTimes(1)
  })

  it('clears the check when an unheard string changes pitch', async () => {
    hear(pitchToFrequency(E2))
    const { result } = renderHook(() => useTunerState())
    await waitFor(() => {
      expect(result.current.checkedStrings).toEqual([0])
    })
    act(() => {
      result.current.editString(5, { note: 'F', octave: 4 })
    })
    await act(async () => undefined)
    expect(result.current.tuning.id).toBe('custom-draft')
    expectStringReading(result.current.analysis, 'in-tune', 0)
    expect(result.current.checkedStrings).toEqual([])
    expect(pulseHaptic).toHaveBeenCalledTimes(1)
  })

  it('EC-lock-gated does not check a gated pitch and keeps the check when the pitch drops out', async () => {
    hear(null)
    const { result, rerender } = renderHook(() => useTunerState())
    await act(async () => undefined)
    expect(result.current.analysis).toBeNull()
    expect(result.current.checkedStrings).toEqual([])
    expect(pulseHaptic).not.toHaveBeenCalled()

    hear(pitchToFrequency(E2))
    rerender()
    await waitFor(() => {
      expect(result.current.checkedStrings).toEqual([0])
    })
    expect(pulseHaptic).toHaveBeenCalledTimes(1)

    hear(null)
    rerender()
    await act(async () => undefined)
    expect(result.current.analysis).toBeNull()
    expect(result.current.checkedStrings).toEqual([0])
    expect(pulseHaptic).toHaveBeenCalledTimes(1)
  })

  it('keeps the check and stays quiet on the chromatic screen', async () => {
    hear(pitchToFrequency(E2))
    const { result } = renderHook(() => useTunerState())
    await waitFor(() => {
      expect(result.current.checkedStrings).toEqual([0])
    })
    act(() => {
      result.current.setScreen('chromatic')
    })
    await act(async () => undefined)
    expect(result.current.analysis?.kind).toBe('chromatic')
    expect(result.current.checkedStrings).toEqual([0])
    expect(pulseHaptic).toHaveBeenCalledTimes(1)
  })

  it('checks only the analyzed index when two strings share a pitch', async () => {
    const twins: Tuning = {
      id: 'twins',
      name: 'Twins',
      instrument: 'guitar',
      strings: [{ pitch: E2 }, { pitch: E2 }],
    }
    hear(pitchToFrequency(E2))
    const { result, rerender } = renderHook(() => useTunerState())
    await waitFor(() => {
      expect(result.current.checkedStrings).toEqual([0])
    })
    act(() => {
      result.current.selectTuning(twins)
    })
    await act(async () => undefined)
    expect(result.current.checkedStrings).toEqual([])

    hear(detuned(E2, 40))
    rerender()
    await act(async () => undefined)
    expectStringReading(result.current.analysis, 'loosen', 0)
    expect(result.current.checkedStrings).toEqual([])
    expect(pulseHaptic).toHaveBeenCalledTimes(1)

    hear(pitchToFrequency(E2))
    rerender()
    await waitFor(() => {
      expect(result.current.checkedStrings).toEqual([0])
    })
    expect(pulseHaptic).toHaveBeenCalledTimes(2)
  })

  it('EC-lock-save clears checks when a draft is saved under a new id', async () => {
    hear(pitchToFrequency(E2))
    const { result } = renderHook(() => useTunerState())
    await waitFor(() => {
      expect(result.current.checkedStrings).toEqual([0])
    })
    act(() => {
      result.current.saveDraft('Mine')
    })
    await act(async () => undefined)
    expect(result.current.tuning.name).toBe('Mine')
    expect(result.current.tuning.id.startsWith('custom-')).toBe(true)
    expectStringReading(result.current.analysis, 'in-tune', 0)
    expect(result.current.checkedStrings).toEqual([])
    expect(pulseHaptic).toHaveBeenCalledTimes(1)
  })

  it('EC-lock-rename keeps the check when only the name changes', async () => {
    hear(pitchToFrequency(E2))
    const { result, rerender } = renderHook(() => useTunerState())
    await waitFor(() => {
      expect(result.current.checkedStrings).toEqual([0])
    })
    act(() => {
      result.current.saveDraft('Mine')
    })
    await act(async () => undefined)
    expect(result.current.checkedStrings).toEqual([])

    hear(detuned(E2, 40))
    rerender()
    await act(async () => undefined)
    hear(pitchToFrequency(E2))
    rerender()
    await waitFor(() => {
      expect(result.current.checkedStrings).toEqual([0])
    })
    const id = result.current.tuning.id
    const pulses = vi.mocked(pulseHaptic).mock.calls.length

    act(() => {
      result.current.renameCustom(id, 'Renamed')
    })
    await act(async () => undefined)
    expect(result.current.tuning.id).toBe(id)
    expect(result.current.tuning.name).toBe('Renamed')
    expect(result.current.checkedStrings).toEqual([0])
    expect(pulseHaptic).toHaveBeenCalledTimes(pulses)
  })
})
