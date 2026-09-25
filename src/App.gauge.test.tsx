import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { pitchToFrequency } from './core/music'
import { memoryStorage } from './test/memoryStorage'
import { UI } from './components/strings'
import App from './App'

const { pitch } = vi.hoisted(() => ({
  pitch: {
    status: 'listening' as const,
    error: null as null,
    frequency: 0 as number | null,
    clarity: 0.95 as number | null,
    start: vi.fn(),
    stop: vi.fn(),
  },
}))

vi.mock('./audio/usePitch', () => ({
  usePitch: () => pitch,
}))

vi.mock('./audio/referenceTone', () => ({
  playReferencePitch: vi.fn(() => Promise.resolve()),
  warmReferenceAudio: vi.fn(() => Promise.resolve()),
}))

describe('App pitch display', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage())
    vi.stubGlobal('sessionStorage', memoryStorage())
    pitch.status = 'listening'
    pitch.frequency = pitchToFrequency({ note: 'E', octave: 2 })
    pitch.clarity = 0.95
  })

  it('EC-gauge-center centers the gauge on an in-tune string and shows chromatic cents', async () => {
    const user = userEvent.setup()
    const e2 = pitchToFrequency({ note: 'E', octave: 2 })
    pitch.frequency = e2 * 2 ** (4 / 1200)
    const { container } = render(<App />)
    expect(container.querySelector('.gauge-note')?.textContent).toBe('E2')
    expect(container.querySelector('line[stroke-linecap="round"]')?.outerHTML).toContain(
      'rotate(0deg)',
    )
    expect(container.querySelector('.gauge-note-in-tune')).toBeTruthy()
    await user.click(screen.getByRole('tab', { name: UI.screenChromatic }))
    expect(container.querySelector('.gauge-note')?.textContent).toBe('E2')
    pitch.frequency = 440
    await user.click(screen.getByRole('tab', { name: UI.screenStrings }))
    await user.click(screen.getByRole('tab', { name: UI.screenChromatic }))
    expect(container.querySelector('.gauge-note')?.textContent).toBe('A4')
  })
})
