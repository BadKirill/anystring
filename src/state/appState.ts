import { useCallback, useState } from 'react'

import { usePitch } from '../audio/usePitch'
import { pitchesEqual, type Pitch } from '../core/music'
import {
  analyze,
  analyzeChromatic,
  analyzeString,
  type ChromaticAnalysis,
  type StringAnalysis,
  type Tuning,
} from '../core/tunings'
import { DRAFT_TUNING_ID } from '../core/tunings/custom'
import { readActiveTuning, writeActiveTuning } from '../storage/customTuningsStore'

import { defaultTuning } from './tuningDefaults'
import { useSavedTunings } from './useSavedTunings'
import { useStableAnalysis } from './useStableAnalysis'

export { DRAFT_TUNING_ID }

export type TunerScreen = 'strings' | 'chromatic'

export type DisplayAnalysis =
  ({ kind: 'string' } & StringAnalysis) | ({ kind: 'chromatic' } & ChromaticAnalysis)

function withEditedString(prev: Tuning, index: number, notePitch: Pitch): Tuning {
  const current = prev.strings[index]?.pitch
  if (current && pitchesEqual(current, notePitch)) {
    return prev
  }
  return {
    ...prev,
    id: DRAFT_TUNING_ID,
    name: prev.id === DRAFT_TUNING_ID ? prev.name : 'Custom',
    strings: prev.strings.map((s, i) => (i === index ? { pitch: notePitch } : s)),
  }
}

export interface TunerState {
  screen: TunerScreen
  setScreen: (screen: TunerScreen) => void
  tuning: Tuning
  pickerTunings: Tuning[]
  tuningsRevision: number
  manualStringIndex: number | null
  analysis: DisplayAnalysis | null
  pitch: ReturnType<typeof usePitch>
  selectTuning: (tuning: Tuning) => void
  selectString: (index: number | null) => void
  editString: (index: number, pitch: Pitch) => void
  saveDraft: (name: string) => void
  deleteCustom: (id: string) => void
  renameCustom: (id: string, name: string) => void
  refreshMyTunings: () => void
}

function computeStringAnalysis(
  frequency: number,
  tuning: Tuning,
  manualStringIndex: number | null,
): DisplayAnalysis | null {
  const raw =
    manualStringIndex === null
      ? analyze(frequency, tuning)
      : analyzeString(frequency, tuning, manualStringIndex)
  return raw ? { kind: 'string', ...raw } : null
}

function computeAnalysis(
  screen: TunerScreen,
  frequency: number | null,
  tuning: Tuning,
  manualStringIndex: number | null,
): DisplayAnalysis | null {
  if (frequency === null) {
    return null
  }
  if (screen === 'chromatic') {
    return { kind: 'chromatic', ...analyzeChromatic(frequency) }
  }
  return computeStringAnalysis(frequency, tuning, manualStringIndex)
}

function analysisScope(
  screen: TunerScreen,
  tuningId: string,
  manualStringIndex: number | null,
): string {
  if (screen === 'chromatic') {
    return 'chromatic'
  }
  const mode = manualStringIndex === null ? 'auto' : String(manualStringIndex)
  return `strings:${tuningId}:${mode}`
}

function analysisMode(screen: TunerScreen): 'stabilize' | 'passthrough' {
  return screen === 'chromatic' ? 'passthrough' : 'stabilize'
}

export function useTunerState(): TunerState {
  const [screen, setScreen] = useState<TunerScreen>('strings')
  const [tuning, setTuning] = useState<Tuning>(
    () => readActiveTuning() ?? defaultTuning(),
  )
  const [manualStringIndex, setManualStringIndex] = useState<number | null>(null)
  const pitch = usePitch()

  const saved = useSavedTunings(tuning, setTuning)

  const rawAnalysis = computeAnalysis(screen, pitch.frequency, tuning, manualStringIndex)
  const scope = analysisScope(screen, tuning.id, manualStringIndex)
  const analysis = useStableAnalysis(
    rawAnalysis,
    pitch.clarity,
    pitch.frequency,
    scope,
    analysisMode(screen),
  )

  const selectTuning = useCallback((next: Tuning) => {
    setTuning(next)
    setManualStringIndex(null)
    writeActiveTuning(next)
  }, [])

  const editString = useCallback((index: number, notePitch: Pitch) => {
    setTuning((prev) => withEditedString(prev, index, notePitch))
  }, [])

  return {
    screen,
    setScreen,
    tuning,
    pickerTunings: saved.pickerTunings,
    tuningsRevision: saved.tuningsRevision,
    manualStringIndex,
    analysis,
    pitch,
    selectTuning,
    selectString: setManualStringIndex,
    editString,
    saveDraft: saved.saveDraft,
    deleteCustom: saved.deleteCustom,
    renameCustom: saved.renameCustom,
    refreshMyTunings: saved.refreshMyTunings,
  }
}
