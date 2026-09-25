import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { TuneDirectionHint } from './TuneDirectionHint'
import { UI } from './strings'
import type { PitchState } from '../audio/pitchState'
import type { Tuning } from '../core/tunings'

const TUNING: Tuning = {
  id: 'guitar-standard',
  name: 'Standard E',
  instrument: 'guitar',
  strings: [{ pitch: { note: 'E', octave: 2 } }, { pitch: { note: 'A', octave: 2 } }],
}

const idle: PitchState = {
  status: 'idle',
  error: null,
  frequency: null,
  clarity: null,
}

describe('TuneDirectionHint', () => {
  it('shows microphone errors from the pitch state', () => {
    render(
      <TuneDirectionHint
        pitch={{ ...idle, status: 'error', error: 'permission-denied' }}
        analysis={null}
        tuning={TUNING}
        manualMode={false}
        chromatic={false}
      />,
    )
    expect(screen.getByRole('alert').textContent).toBe(UI.micDenied)
  })

  it('shows starting and listening idle copy', () => {
    const { rerender } = render(
      <TuneDirectionHint
        pitch={{ ...idle, status: 'starting' }}
        analysis={null}
        tuning={TUNING}
        manualMode={false}
        chromatic={false}
      />,
    )
    expect(screen.getByText(UI.starting)).toBeTruthy()
    rerender(
      <TuneDirectionHint
        pitch={{ ...idle, status: 'listening' }}
        analysis={null}
        tuning={TUNING}
        manualMode={false}
        chromatic={false}
      />,
    )
    expect(screen.getByText(UI.playAnyString)).toBeTruthy()
    rerender(
      <TuneDirectionHint
        pitch={{ ...idle, status: 'listening' }}
        analysis={null}
        tuning={TUNING}
        manualMode
        chromatic={false}
      />,
    )
    expect(screen.getByText(UI.playSelectedString)).toBeTruthy()
    rerender(
      <TuneDirectionHint
        pitch={{ ...idle, status: 'listening' }}
        analysis={null}
        tuning={TUNING}
        manualMode={false}
        chromatic
      />,
    )
    expect(screen.getByText(UI.playANote)).toBeTruthy()
  })

  it('EC-hint-round describes string and chromatic analysis', () => {
    const { rerender } = render(
      <TuneDirectionHint
        pitch={{ ...idle, status: 'listening', frequency: 82 }}
        analysis={{ kind: 'string', stringIndex: 0, cents: 0, direction: 'in-tune' }}
        tuning={TUNING}
        manualMode={false}
        chromatic={false}
      />,
    )
    expect(screen.getByText(/String 1 \(E2\): in tune/)).toBeTruthy()
    rerender(
      <TuneDirectionHint
        pitch={{ ...idle, status: 'listening', frequency: 80 }}
        analysis={{ kind: 'string', stringIndex: 0, cents: -12, direction: 'tighten' }}
        tuning={TUNING}
        manualMode={false}
        chromatic={false}
      />,
    )
    expect(screen.getByText(/too low — tighten/)).toBeTruthy()
    rerender(
      <TuneDirectionHint
        pitch={{ ...idle, status: 'listening', frequency: 84 }}
        analysis={{ kind: 'string', stringIndex: 0, cents: 12, direction: 'loosen' }}
        tuning={TUNING}
        manualMode={false}
        chromatic={false}
      />,
    )
    expect(screen.getByText(/too high — loosen/)).toBeTruthy()
    rerender(
      <TuneDirectionHint
        pitch={{ ...idle, status: 'listening', frequency: 440 }}
        analysis={{
          kind: 'chromatic',
          pitch: { note: 'A', octave: 4 },
          cents: 0,
          direction: 'in-tune',
        }}
        tuning={TUNING}
        manualMode={false}
        chromatic
      />,
    )
    expect(screen.getByText(`A4 · ${UI.chromaticCentered}`)).toBeTruthy()
    rerender(
      <TuneDirectionHint
        pitch={{ ...idle, status: 'listening', frequency: 430 }}
        analysis={{
          kind: 'chromatic',
          pitch: { note: 'A', octave: 4 },
          cents: -18,
          direction: 'tighten',
        }}
        tuning={TUNING}
        manualMode={false}
        chromatic
      />,
    )
    expect(screen.getByText(/-18¢/)).toBeTruthy()
    rerender(
      <TuneDirectionHint
        pitch={{ ...idle, status: 'listening', frequency: 450 }}
        analysis={{
          kind: 'chromatic',
          pitch: { note: 'A', octave: 4 },
          cents: 18,
          direction: 'loosen',
        }}
        tuning={TUNING}
        manualMode={false}
        chromatic
      />,
    )
    expect(screen.getByText(/\+18¢/)).toBeTruthy()
    rerender(
      <TuneDirectionHint
        pitch={{ ...idle, status: 'listening', frequency: 442 }}
        analysis={{
          kind: 'chromatic',
          pitch: { note: 'A', octave: 4 },
          cents: 5.4,
          direction: 'loosen',
        }}
        tuning={TUNING}
        manualMode={false}
        chromatic
      />,
    )
    expect(screen.getByText(/\+5¢/)).toBeTruthy()
    expect(screen.getByText(/sharp — tune down/)).toBeTruthy()
  })

  it('falls back to edit hint, empty chromatic, and missing-string copy', () => {
    const { rerender, container } = render(
      <TuneDirectionHint
        pitch={idle}
        analysis={null}
        tuning={TUNING}
        manualMode={false}
        chromatic={false}
      />,
    )
    expect(screen.getByText(UI.tapAgainToEdit)).toBeTruthy()
    rerender(
      <TuneDirectionHint
        pitch={idle}
        analysis={null}
        tuning={TUNING}
        manualMode={false}
        chromatic
      />,
    )
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy()
    rerender(
      <TuneDirectionHint
        pitch={{ ...idle, status: 'listening', frequency: 82 }}
        analysis={{ kind: 'string', stringIndex: 9, cents: 0, direction: 'in-tune' }}
        tuning={TUNING}
        manualMode={false}
        chromatic={false}
      />,
    )
    expect(container.querySelector('.hint')?.textContent).toBe('')
  })
})
