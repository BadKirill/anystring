import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PRESET_TUNINGS, type Tuning } from '../core/tunings'
import { memoryStorage } from '../test/memoryStorage'
import { PresetPicker } from './PresetPicker'
import { UI } from './strings'

function guitarStandard(): Tuning {
  const tuning = PRESET_TUNINGS.find((entry) => entry.id === 'guitar-standard')
  if (!tuning) {
    throw new Error('guitar-standard preset is missing')
  }
  return tuning
}

describe('PresetPicker', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage())
    vi.stubGlobal('sessionStorage', memoryStorage())
    window.matchMedia = (query: string): MediaQueryList =>
      ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false,
      }) as MediaQueryList
  })

  it('selects a nested preset and saves a draft name', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const onSaveDraft = vi.fn()
    const onClose = vi.fn()
    render(
      <PresetPicker
        customTunings={[]}
        activeTuning={guitarStandard()}
        canSaveDraft
        onSelect={onSelect}
        onSaveDraft={onSaveDraft}
        onDeleteCustom={vi.fn()}
        onRenameCustom={vi.fn()}
        onClose={onClose}
      />,
    )
    expect(screen.getByText(UI.saveHint)).toBeTruthy()
    await user.type(screen.getByPlaceholderText(UI.namePlaceholder), 'Mine')
    await user.click(screen.getByRole('button', { name: UI.save }))
    expect(onSaveDraft).toHaveBeenCalledWith('Mine')
    await user.click(screen.getByRole('button', { name: /Drop D/ }))
    expect(onSelect).toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: UI.bass }))
    expect(screen.getByRole('button', { name: /Standard \(4-string\)/ })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: UI.bass }))
    await user.click(screen.getByRole('button', { name: UI.close }))
    expect(onClose).toHaveBeenCalled()
  })

  it('hides the save field when the active tuning is not a draft', () => {
    render(
      <PresetPicker
        customTunings={[]}
        activeTuning={guitarStandard()}
        canSaveDraft={false}
        onSelect={vi.fn()}
        onSaveDraft={vi.fn()}
        onDeleteCustom={vi.fn()}
        onRenameCustom={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    expect(screen.queryByText(UI.saveHint)).toBeNull()
    expect(screen.queryByRole('button', { name: UI.save })).toBeNull()
    expect(screen.getByText(UI.noCustomTunings)).toBeTruthy()
  })
})
