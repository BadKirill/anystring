import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { AnalyticsEvent } from '../core/analytics'
import { INITIAL_REVIEW_STATE } from '../core/review'
import { writeReviewState } from '../storage/telemetryStore'
import { memoryStorage } from '../test/memoryStorage'
import type { TunerState } from './appState'
import { useUsageTelemetry } from './useUsageTelemetry'

function tuner(overrides: Partial<TunerState> = {}): TunerState {
  return {
    screen: 'strings',
    setScreen: vi.fn(),
    tuning: {
      id: 'guitar-standard',
      name: 'Standard E',
      instrument: 'guitar',
      strings: [{ pitch: { note: 'E', octave: 2 } }],
    },
    pickerTunings: [],
    tuningsRevision: 0,
    manualStringIndex: null,
    analysis: null,
    pitch: {
      status: 'idle',
      error: null,
      frequency: null,
      clarity: null,
      start: vi.fn(),
      stop: vi.fn(),
    },
    selectTuning: vi.fn(),
    selectString: vi.fn(),
    editString: vi.fn(),
    saveDraft: vi.fn(),
    deleteCustom: vi.fn(),
    renameCustom: vi.fn(),
    refreshMyTunings: vi.fn(),
    ...overrides,
  }
}

function typesOf(events: AnalyticsEvent[]): AnalyticsEvent['type'][] {
  return events.map((event) => event.type)
}

describe('useUsageTelemetry', () => {
  it('opens the app and records a successful strings session', () => {
    vi.stubGlobal('localStorage', memoryStorage())
    const events: AnalyticsEvent[] = []
    const requestReview = vi.fn().mockResolvedValue(undefined)
    const { rerender, result } = renderHook(
      (state: TunerState) =>
        useUsageTelemetry(state, {
          track: (event) => {
            events.push(event)
          },
          now: () => 10_000,
          version: '1.4.0',
          platform: 'web',
          isNative: false,
          requestReview,
        }),
      { initialProps: tuner() },
    )
    expect(typesOf(events)).toEqual(['app.open', 'screen.view'])

    rerender(
      tuner({
        pitch: {
          status: 'listening',
          error: null,
          frequency: 82.41,
          clarity: 0.95,
          start: vi.fn(),
          stop: vi.fn(),
        },
      }),
    )
    rerender(
      tuner({
        pitch: {
          status: 'listening',
          error: null,
          frequency: 82.41,
          clarity: 0.95,
          start: vi.fn(),
          stop: vi.fn(),
        },
        analysis: { kind: 'string', stringIndex: 0, cents: 0, direction: 'in-tune' },
      }),
    )
    rerender(tuner())
    expect(typesOf(events)).toContain('mic.start')
    expect(events.some((event) => event.type === 'session.end' && event.inTune)).toBe(
      true,
    )
    expect(result.current.webReviewVisible).toBe(false)
    expect(requestReview).not.toHaveBeenCalled()
  })

  it('EC-review-web-prompt: shows the web prompt after three in-tune sessions', () => {
    vi.stubGlobal('localStorage', memoryStorage())
    writeReviewState({ ...INITIAL_REVIEW_STATE, successfulSessions: 2 })
    const { rerender, result } = renderHook(
      (state: TunerState) =>
        useUsageTelemetry(state, {
          track: () => undefined,
          now: () => 20_000,
          version: '1.4.0',
          platform: 'web',
          isNative: false,
          requestReview: vi.fn(),
        }),
      {
        initialProps: tuner({
          pitch: {
            status: 'listening',
            error: null,
            frequency: 82.41,
            clarity: 0.95,
            start: vi.fn(),
            stop: vi.fn(),
          },
          analysis: { kind: 'string', stringIndex: 0, cents: 0, direction: 'in-tune' },
        }),
      },
    )
    rerender(tuner())
    expect(result.current.webReviewVisible).toBe(true)
    act(() => {
      result.current.dismissWebReview()
    })
    expect(result.current.webReviewVisible).toBe(false)
  })

  it('asks the native store on the third in-tune session', () => {
    vi.stubGlobal('localStorage', memoryStorage())
    writeReviewState({ ...INITIAL_REVIEW_STATE, successfulSessions: 2 })
    const requestReview = vi.fn().mockResolvedValue(undefined)
    const { rerender } = renderHook(
      (state: TunerState) =>
        useUsageTelemetry(state, {
          track: () => undefined,
          now: () => 20_000,
          version: '1.4.0',
          platform: 'ios',
          isNative: true,
          requestReview,
        }),
      {
        initialProps: tuner({
          pitch: {
            status: 'listening',
            error: null,
            frequency: 82.41,
            clarity: 0.95,
            start: vi.fn(),
            stop: vi.fn(),
          },
          analysis: { kind: 'string', stringIndex: 0, cents: 0, direction: 'in-tune' },
        }),
      },
    )
    rerender(tuner())
    expect(requestReview).toHaveBeenCalledOnce()
  })
})
