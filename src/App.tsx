import { useState } from 'react'

import './App.css'
import { AboutSheet } from './components/AboutSheet'
import { InstallHint } from './components/InstallHint'
import { NotePicker } from './components/NotePicker'
import { PresetPicker } from './components/PresetPicker'
import { StringList } from './components/StringList'
import { TuneDirectionHint } from './components/TuneDirectionHint'
import { TunerGauge } from './components/TunerGauge'
import { UI } from './components/strings'
import { formatPitch } from './core/music'
import {
  DRAFT_TUNING_ID,
  useTunerState,
  type DisplayAnalysis,
  type TunerScreen,
  type TunerState,
} from './state/appState'

type Modal =
  | { kind: 'none' }
  | { kind: 'presets' }
  | { kind: 'about' }
  | { kind: 'edit'; index: number }

function gaugeCentsFor(analysis: DisplayAnalysis | null): number | null {
  if (!analysis) {
    return null
  }
  // Strings: snap needle to center when in-tune. Chromatic: always show live cents.
  if (analysis.kind === 'string' && analysis.direction === 'in-tune') {
    return 0
  }
  return analysis.cents
}

function gaugeTargetLabel(
  state: TunerState,
  analysis: DisplayAnalysis | null,
): string | null {
  if (analysis?.kind === 'chromatic') {
    return formatPitch(analysis.pitch)
  }
  const targetIndex = state.manualStringIndex ?? analysis?.stringIndex ?? null
  if (targetIndex === null) {
    return null
  }
  const targetString = state.tuning.strings[targetIndex]
  return targetString ? formatPitch(targetString.pitch) : null
}

function ScreenTabs({ state }: { state: TunerState }) {
  const tabs: { id: TunerScreen; label: string }[] = [
    { id: 'strings', label: UI.screenStrings },
    { id: 'chromatic', label: UI.screenChromatic },
  ]
  return (
    <div className="screen-tabs" role="tablist" aria-label={UI.appName}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={state.screen === tab.id}
          className={state.screen === tab.id ? 'chip chip-selected' : 'chip'}
          onClick={() => {
            state.setScreen(tab.id)
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

function Header({
  state,
  onOpenPresets,
  onOpenAbout,
}: {
  state: TunerState
  onOpenPresets: () => void
  onOpenAbout: () => void
}) {
  return (
    <header className="app-header">
      <h1 className="app-title">{UI.appName}</h1>
      <div className="header-actions">
        {state.screen === 'chromatic' ? (
          <span className="screen-label">{UI.screenChromatic}</span>
        ) : (
          <button type="button" className="tuning-picker-button" onClick={onOpenPresets}>
            {state.tuning.name}
          </button>
        )}
        <button
          type="button"
          className="about-button"
          aria-label={UI.about}
          onClick={onOpenAbout}
        >
          i
        </button>
      </div>
    </header>
  )
}

function ModeControls({ state }: { state: TunerState }) {
  const listening = state.pitch.status === 'listening'
  const listenButton = (
    <button
      type="button"
      className={listening ? 'button-secondary' : 'button-primary'}
      onClick={listening ? state.pitch.stop : state.pitch.start}
    >
      {listening ? UI.stopListening : UI.startListening}
    </button>
  )
  if (state.screen === 'chromatic') {
    return <div className="mode-row">{listenButton}</div>
  }
  const auto = state.manualStringIndex === null
  return (
    <div className="mode-row">
      <button
        type="button"
        className={auto ? 'chip chip-selected' : 'chip'}
        aria-pressed={auto}
        onClick={() => {
          // Always clear manual target — even if already Auto, so a stuck
          // highlight from a previous detection cannot leave the UI feeling dead.
          state.selectString(null)
        }}
      >
        {UI.auto}
      </button>
      {listenButton}
    </div>
  )
}

function Modals({
  state,
  modal,
  onClose,
}: {
  state: TunerState
  modal: Modal
  onClose: () => void
}) {
  if (modal.kind === 'presets') {
    return (
      <PresetPicker
        key={state.tuningsRevision}
        customTunings={state.pickerTunings}
        activeTuning={state.tuning}
        canSaveDraft={state.tuning.id === DRAFT_TUNING_ID}
        onSelect={(tuning) => {
          state.selectTuning(tuning)
          onClose()
        }}
        onSaveDraft={(name) => {
          state.saveDraft(name)
        }}
        onDeleteCustom={state.deleteCustom}
        onRenameCustom={state.renameCustom}
        onClose={onClose}
      />
    )
  }
  if (modal.kind === 'edit') {
    const string = state.tuning.strings[modal.index]
    if (!string) {
      return null
    }
    return (
      <NotePicker
        initial={string.pitch}
        onConfirm={(pitch) => {
          state.editString(modal.index, pitch)
          onClose()
        }}
        onClose={onClose}
      />
    )
  }
  return null
}

function StringsExtras({
  state,
  setModal,
}: {
  state: TunerState
  setModal: (modal: Modal) => void
}) {
  const { tuning, analysis, manualStringIndex } = state
  const targetIndex =
    manualStringIndex ?? (analysis?.kind === 'string' ? analysis.stringIndex : null)
  return (
    <StringList
      tuning={tuning}
      activeIndex={targetIndex}
      manualIndex={manualStringIndex}
      onSelect={state.selectString}
      onEdit={(index) => {
        setModal({ kind: 'edit', index })
      }}
    />
  )
}

function App() {
  const state = useTunerState()
  const [modal, setModal] = useState<Modal>({ kind: 'none' })
  const { analysis, pitch, manualStringIndex, screen } = state
  const chromatic = screen === 'chromatic'
  const closeModal = () => {
    setModal({ kind: 'none' })
  }

  return (
    <div className="app">
      <InstallHint />
      <Header
        state={state}
        onOpenPresets={() => {
          state.refreshMyTunings()
          setModal({ kind: 'presets' })
        }}
        onOpenAbout={() => {
          setModal({ kind: 'about' })
        }}
      />
      <ScreenTabs state={state} />
      <ModeControls state={state} />
      <TunerGauge
        cents={gaugeCentsFor(analysis)}
        targetLabel={gaugeTargetLabel(state, analysis)}
        inTune={analysis?.direction === 'in-tune'}
        chromatic={chromatic}
      />
      <TuneDirectionHint
        pitch={pitch}
        analysis={analysis}
        tuning={state.tuning}
        manualMode={manualStringIndex !== null}
        chromatic={chromatic}
      />
      {!chromatic && <StringsExtras state={state} setModal={setModal} />}
      {!chromatic && <Modals state={state} modal={modal} onClose={closeModal} />}
      {modal.kind === 'about' && <AboutSheet onClose={closeModal} />}
    </div>
  )
}

export default App
