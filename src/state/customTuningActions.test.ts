import { beforeEach, describe, expect, it, vi } from 'vitest'

import { defaultTuning } from '../state/tuningDefaults'
import { memoryStorage } from '../test/memoryStorage'
import {
  createDeleteCustomHandler,
  createRenameCustomHandler,
  createSaveDraftHandler,
} from './customTuningActions'
import type { Tuning } from '../core/tunings'
import { saveCustomTuning } from '../storage/customTuningsStore'

const DRAFT: Tuning = {
  id: 'custom-draft',
  name: 'Custom',
  instrument: 'guitar',
  strings: [{ pitch: { note: 'E', octave: 2 } }],
}

describe('customTuningActions', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage())
    vi.stubGlobal('sessionStorage', memoryStorage())
  })

  it('ignores a blank draft name and saves a trimmed name', () => {
    let tuning = DRAFT
    let saved: Tuning[] = []
    let bumps = 0
    const save = createSaveDraftHandler(
      DRAFT,
      (update) => {
        tuning = typeof update === 'function' ? update(tuning) : update
      },
      (update) => {
        saved = typeof update === 'function' ? update(saved) : update
      },
      () => {
        bumps += 1
      },
    )
    save('   ')
    expect(saved).toEqual([])
    expect(bumps).toBe(0)
    save('  Demiurge  ')
    expect(tuning.name).toBe('Demiurge')
    expect(tuning.id.startsWith('custom-')).toBe(true)
    expect(saved).toEqual([tuning])
    expect(bumps).toBe(1)
  })

  it('deletes a custom tuning and restores the default when it was active', () => {
    saveCustomTuning({ ...DRAFT, id: 'custom-1', name: 'Keep' })
    saveCustomTuning({ ...DRAFT, id: 'custom-2', name: 'Gone' })
    let tuning: Tuning = { ...DRAFT, id: 'custom-2', name: 'Gone' }
    let saved: Tuning[] = [{ ...DRAFT, id: 'custom-1', name: 'Keep' }, tuning]
    const remove = createDeleteCustomHandler(
      (update) => {
        tuning = typeof update === 'function' ? update(tuning) : update
      },
      (update) => {
        saved = typeof update === 'function' ? update(saved) : update
      },
      () => undefined,
    )
    remove('custom-2')
    expect(saved.map((entry) => entry.id)).toEqual(['custom-1'])
    expect(tuning).toEqual(defaultTuning())
    remove('custom-1')
    expect(saved).toEqual([])
  })

  it('renames a saved tuning and leaves a different active tuning alone', () => {
    const kept: Tuning = { ...DRAFT, id: 'custom-1', name: 'Keep' }
    saveCustomTuning(kept)
    saveCustomTuning({ ...DRAFT, id: 'custom-2', name: 'Old' })
    let tuning = kept
    let saved: Tuning[] = [kept, { ...DRAFT, id: 'custom-2', name: 'Old' }]
    const rename = createRenameCustomHandler(
      (update) => {
        tuning = typeof update === 'function' ? update(tuning) : update
      },
      (update) => {
        saved = typeof update === 'function' ? update(saved) : update
      },
      () => undefined,
    )
    rename('missing', 'Nope')
    expect(saved.find((entry) => entry.id === 'custom-2')?.name).toBe('Old')
    rename('custom-2', 'New')
    expect(saved.find((entry) => entry.id === 'custom-2')?.name).toBe('New')
    expect(tuning).toEqual(kept)
    let active: Tuning = { ...DRAFT, id: 'custom-2', name: 'Old' }
    const renameActive = createRenameCustomHandler(
      (update) => {
        active = typeof update === 'function' ? update(active) : update
      },
      (update) => {
        saved = typeof update === 'function' ? update(saved) : update
      },
      () => undefined,
    )
    renameActive('custom-2', 'Active')
    expect(active.name).toBe('Active')
  })
})
