import { pitchesEqual } from '../music'

import { PRESET_TUNINGS } from './presets'
import type { Tuning } from './types'

export const DRAFT_TUNING_ID = 'custom-draft'

const PRESET_IDS = new Set(PRESET_TUNINGS.map((preset) => preset.id))

export function isSavedCustomTuning(tuning: Tuning): boolean {
  if (isDraftTuning(tuning)) {
    return false
  }
  if (tuning.id.startsWith('custom-')) {
    return true
  }
  return !PRESET_IDS.has(tuning.id)
}

export function isDraftTuning(tuning: Tuning): boolean {
  return tuning.id === DRAFT_TUNING_ID
}

export function isUnmodifiedPreset(tuning: Tuning): boolean {
  const preset = PRESET_TUNINGS.find((entry) => entry.id === tuning.id)
  if (!preset) {
    return false
  }
  if (tuning.name !== preset.name || tuning.strings.length !== preset.strings.length) {
    return false
  }
  return tuning.strings.every((string, index) => {
    const presetPitch = preset.strings[index]?.pitch
    return presetPitch !== undefined && pitchesEqual(string.pitch, presetPitch)
  })
}

export function belongsInMyTunings(tuning: Tuning): boolean {
  if (isDraftTuning(tuning)) {
    return false
  }
  if (isSavedCustomTuning(tuning)) {
    return true
  }
  return !isUnmodifiedPreset(tuning)
}

export function appearsInPicker(tuning: Tuning): boolean {
  return belongsInMyTunings(tuning)
}
