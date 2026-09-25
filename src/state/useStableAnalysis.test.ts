import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { TuneDirection } from '../core/tunings'
import { useStableAnalysis } from './useStableAnalysis'

interface StringReading {
  cents: number
  direction: TuneDirection
  stringIndex: number
}

describe('useStableAnalysis', () => {
  it('EC-scope-reset latches in-tune string readings and resets when the scope changes', () => {
    const first: StringReading = {
      cents: 2,
      direction: 'in-tune',
      stringIndex: 0,
    }
    const { result, rerender } = renderHook(
      (props: {
        raw: StringReading | null
        scope: string
        mode: 'stabilize' | 'passthrough'
        frequency: number | null
      }) => useStableAnalysis(props.raw, 0.95, props.frequency, props.scope, props.mode),
      {
        initialProps: {
          raw: first as StringReading | null,
          scope: 'strings:a:auto',
          mode: 'stabilize' as const,
          frequency: 82.4 as number | null,
        },
      },
    )
    rerender({
      raw: { ...first, cents: 3 },
      scope: 'strings:a:auto',
      mode: 'stabilize',
      frequency: 82.4,
    })
    expect(result.current?.cents).toBe(0)
    expect(result.current?.direction).toBe('in-tune')
    rerender({
      raw: { ...first, cents: 20, direction: 'loosen' },
      scope: 'strings:b:auto',
      mode: 'stabilize',
      frequency: 82.4,
    })
    expect(result.current?.cents).toBeGreaterThan(0)
  })

  it('EC-chromatic-live passes chromatic cents through without latching', () => {
    const raw = {
      cents: 2,
      direction: 'in-tune' as const,
      pitch: { note: 'A' as const, octave: 4 },
    }
    const { result, rerender } = renderHook(
      (props: { raw: typeof raw }) =>
        useStableAnalysis(props.raw, 0.95, 440, 'chromatic', 'passthrough'),
      { initialProps: { raw } },
    )
    expect(result.current?.cents).toBe(2)
    rerender({ raw: { ...raw, cents: 3 } })
    expect(result.current?.cents).toBe(3)
  })

  it('EC-decay-latch clears the needle on dropout and keeps the latch for a quick return', () => {
    let now = 5_000
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    const reading: StringReading = { cents: 1, direction: 'in-tune', stringIndex: 0 }
    const { result, rerender } = renderHook(
      (props: { raw: StringReading | null; frequency: number | null }) =>
        useStableAnalysis(props.raw, 0.95, props.frequency, 'strings:a:auto'),
      {
        initialProps: {
          raw: reading as StringReading | null,
          frequency: 82 as number | null,
        },
      },
    )
    now += 40
    rerender({ raw: { ...reading, cents: 2 }, frequency: 82 })
    expect(result.current?.cents).toBe(0)
    now += 80
    rerender({ raw: null, frequency: null })
    expect(result.current).toBeNull()
    now += 40
    rerender({
      raw: { cents: 10, direction: 'loosen', stringIndex: 0 },
      frequency: 82,
    })
    expect(result.current?.cents).toBe(0)
    expect(result.current?.direction).toBe('in-tune')
  })

  it('clears analysis when the frequency drops out', () => {
    const raw: StringReading = { cents: 8, direction: 'loosen', stringIndex: 1 }
    const { result, rerender } = renderHook(
      (props: { raw: StringReading | null; frequency: number | null }) =>
        useStableAnalysis(props.raw, 0.95, props.frequency, 'strings:a:auto'),
      {
        initialProps: {
          raw: raw as StringReading | null,
          frequency: 110 as number | null,
        },
      },
    )
    rerender({ raw: null, frequency: null })
    expect(result.current).toBeNull()
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})
