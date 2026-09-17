import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from './App'
import { UI } from './components/strings'
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
    expect(screen.getByRole('button', { name: UI.startListening })).toBeTruthy()
    await user.click(screen.getByRole('tab', { name: UI.screenChromatic }))
    expect(screen.getByRole('tab', { selected: true })).toHaveProperty(
      'textContent',
      UI.screenChromatic,
    )
    expect(screen.queryByRole('button', { name: UI.auto })).toBeNull()
    await user.click(screen.getByRole('tab', { name: UI.screenStrings }))
    await user.click(screen.getByRole('button', { name: UI.startListening }))
    expect(await screen.findByRole('button', { name: UI.stopListening })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: UI.stopListening }))
    expect(screen.getByRole('button', { name: UI.startListening })).toBeTruthy()
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

  it('shows a microphone permission error', async () => {
    const user = userEvent.setup()
    startMicSession.mockRejectedValue(new MicStreamError('permission-denied'))
    render(<App />)
    await user.click(screen.getByRole('button', { name: UI.startListening }))
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', UI.micDenied)
  })
})
