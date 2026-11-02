import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from './App'
import { UI } from './components/strings'
import { readLayoutSpace } from './components/useTunerLayout'
import { memoryStorage } from './test/memoryStorage'
import type { MicSession } from './audio/micStream'
import { MicStreamError } from './audio/micStream'

const { startMicSession } = vi.hoisted(() => ({
  startMicSession: vi.fn(),
}))

vi.mock('./audio/micStream', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./audio/micStream')>()
  return { ...actual, startMicSession }
})

vi.mock('./audio/referenceTone', () => ({
  playReferencePitch: vi.fn(() => Promise.resolve()),
  warmReferenceAudio: vi.fn(() => Promise.resolve()),
}))

function setViewport(width: number, height: number): void {
  Object.defineProperty(window, 'visualViewport', {
    configurable: true,
    value: {
      width,
      height,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    },
  })
}

function session(): MicSession {
  return {
    sampleRate: 48000,
    resume: vi.fn(async () => true),
    stop: vi.fn(),
  }
}

describe('App', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage())
    vi.stubGlobal('sessionStorage', memoryStorage())
    startMicSession.mockReset()
    startMicSession.mockResolvedValue(session())
  })

  it('switches between strings and chromatic and starts the mic', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByRole('heading', { name: UI.appName })).toBeTruthy()
    expect(await screen.findByRole('button', { name: UI.stopListening })).toBeTruthy()
    expect(startMicSession).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('tab', { name: UI.screenChromatic }))
    expect(screen.getByRole('tab', { selected: true })).toHaveProperty(
      'textContent',
      UI.screenChromatic,
    )
    expect(screen.queryByRole('button', { name: UI.auto })).toBeNull()
    await user.click(screen.getByRole('tab', { name: UI.screenStrings }))
    await user.click(screen.getByRole('button', { name: UI.stopListening }))
    expect(screen.getByRole('button', { name: UI.startListening })).toBeTruthy()
    expect(startMicSession).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('button', { name: UI.startListening }))
    expect(await screen.findByRole('button', { name: UI.stopListening })).toBeTruthy()
    expect(startMicSession).toHaveBeenCalledTimes(2)
  })

  it('opens About and the tuning picker, then edits a string', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: UI.about }))
    expect(screen.getByText(UI.aboutTitle)).toBeTruthy()
    await user.click(screen.getByRole('button', { name: UI.close }))
    await user.click(screen.getByRole('button', { name: 'Standard E' }))
    expect(screen.getByRole('heading', { name: UI.tunings })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: UI.close }))
    await user.click(screen.getByRole('button', { name: /E2/ }))
    await user.click(screen.getByRole('button', { name: /E2/ }))
    expect(screen.getByText(UI.pickNote)).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'F' }))
    await user.click(screen.getByRole('button', { name: UI.done }))
    expect(screen.getByRole('button', { name: UI.customName })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: UI.customName }))
    await user.type(screen.getByPlaceholderText(UI.namePlaceholder), 'Mine')
    await user.click(screen.getByRole('button', { name: UI.save }))
    expect(screen.getByRole('button', { name: 'Mine' })).toBeTruthy()
  })

  it('reads the window size when the visual viewport is missing', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 466 })
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 678 })
    Object.defineProperty(window, 'visualViewport', { configurable: true, value: null })
    expect(readLayoutSpace()).toEqual({ width: 466, height: 678 })
  })

  it('follows a resize from the phone column into the landscape split', () => {
    setViewport(390, 844)
    render(<App />)
    expect(document.querySelector('.app')?.getAttribute('data-layout')).toBe('stack')
    setViewport(951, 669)
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
    expect(document.querySelector('.app')?.getAttribute('data-layout')).toBe('split')
  })

  it('widens on the inner portrait display and splits the string list in landscape', () => {
    setViewport(669, 951)
    const portrait = render(<App />)
    expect(document.querySelector('.app')?.getAttribute('data-layout')).toBe('grow')
    expect(document.querySelector('.layout-secondary')).toBeNull()
    portrait.unmount()
    setViewport(951, 669)
    render(<App />)
    const app = document.querySelector('.app')
    expect(app?.getAttribute('data-layout')).toBe('split')
    expect(app?.getAttribute('data-axis')).toBe('horizontal')
    expect(document.querySelector('.layout-secondary')).not.toBeNull()
  })

  it('shows a microphone permission error once and retries only from the button', async () => {
    const user = userEvent.setup()
    startMicSession.mockRejectedValue(new MicStreamError('permission-denied'))
    render(<App />)
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', UI.micDenied)
    expect(screen.getByRole('button', { name: UI.startListening })).toBeTruthy()
    expect(screen.queryByRole('button', { name: UI.stopListening })).toBeNull()
    expect(startMicSession).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('button', { name: UI.startListening }))
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', UI.micDenied)
    expect(startMicSession).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('button', { name: UI.stopListening })).toBeNull()
    await act(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 50)
      })
    })
    expect(startMicSession).toHaveBeenCalledTimes(2)
  })
})
