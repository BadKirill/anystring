import { useEffect, useMemo, useState } from 'react'

import { formatPitch } from '../core/music'
import {
  INSTRUMENTS,
  presetsFor,
  toggleExclusiveInstrument,
  type Instrument,
  type Tuning,
} from '../core/tunings'
import { appearsInPicker } from '../core/tunings/custom'
import { mergePickerTunings } from '../storage/customTuningsStore'
import { CustomTuningList } from './CustomTuningList'
import { Sheet } from './Sheet'
import { TextField } from './TextField'
import { UI } from './strings'

interface PresetPickerProps {
  customTunings: Tuning[]
  activeTuning: Tuning
  canSaveDraft: boolean
  onSelect: (tuning: Tuning) => void
  onSaveDraft: (name: string) => void
  onDeleteCustom: (id: string) => void
  onRenameCustom: (id: string, name: string) => void
  onClose: () => void
}

function PresetRow({
  tuning,
  onSelect,
}: {
  tuning: Tuning
  onSelect: (tuning: Tuning) => void
}) {
  return (
    <button
      type="button"
      className="list-row instrument-preset"
      onClick={() => {
        onSelect(tuning)
      }}
    >
      <span className="list-row-title">{tuning.name}</span>
      <span className="list-row-subtitle">
        {tuning.strings.map((s) => formatPitch(s.pitch)).join(' ')}
      </span>
    </button>
  )
}

function SaveDraftField({ onSave }: { onSave: (name: string) => void }) {
  const [name, setName] = useState('')

  const submit = () => {
    const trimmed = name.trim()
    if (trimmed !== '') {
      onSave(trimmed)
      setName('')
    }
  }

  return (
    <div className="save-draft-block">
      <p className="hint hint-muted">{UI.saveHint}</p>
      <div className="save-draft-row">
        <TextField
          value={name}
          placeholder={UI.namePlaceholder}
          onChange={setName}
          onSubmit={submit}
        />
        <button
          type="button"
          className="button-primary save-draft-button"
          aria-label={UI.save}
          onClick={submit}
        >
          {UI.save}
        </button>
      </div>
    </div>
  )
}

function instrumentLabel(instrument: Instrument): string {
  if (instrument === 'guitar') {
    return UI.guitar
  }
  if (instrument === 'bass') {
    return UI.bass
  }
  return UI.ukulele
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function useExpandedInstrument(activeInstrument: Instrument): {
  expanded: Instrument | null
  toggle: (instrument: Instrument) => void
} {
  const [expanded, setExpanded] = useState<Instrument | null>(() =>
    prefersReducedMotion() ? activeInstrument : null,
  )
  useEffect(() => {
    if (prefersReducedMotion()) {
      return
    }
    const frame = requestAnimationFrame(() => {
      setExpanded((current) => current ?? activeInstrument)
    })
    return () => {
      cancelAnimationFrame(frame)
    }
  }, [activeInstrument])
  return {
    expanded,
    toggle: (instrument: Instrument) => {
      setExpanded((current) => toggleExclusiveInstrument(current, instrument))
    },
  }
}

function InstrumentHeader({
  instrument,
  expanded,
  activeName,
  panelId,
  onToggle,
}: {
  instrument: Instrument
  expanded: boolean
  activeName: string | null
  panelId: string
  onToggle: () => void
}) {
  const label = instrumentLabel(instrument)
  return (
    <button
      type="button"
      className="list-row instrument-header"
      aria-expanded={expanded}
      aria-controls={expanded ? panelId : undefined}
      aria-label={label}
      onClick={onToggle}
    >
      <span className="instrument-header-text">
        <span className="list-row-title">{label}</span>
        {activeName !== null && <span className="list-row-subtitle">{activeName}</span>}
      </span>
      <span className="instrument-chevron" aria-hidden="true" />
    </button>
  )
}

function InstrumentPresetPanel({
  instrument,
  collapsed,
  onSelect,
}: {
  instrument: Instrument
  collapsed: boolean
  onSelect: (tuning: Tuning) => void
}) {
  return (
    <div
      id={`presets-${instrument}`}
      className="instrument-presets"
      aria-hidden={collapsed}
      inert={collapsed}
    >
      {presetsFor(instrument).map((tuning) => (
        <PresetRow key={tuning.id} tuning={tuning} onSelect={onSelect} />
      ))}
    </div>
  )
}

function InstrumentPresetGroup({
  instrument,
  expanded,
  activeName,
  onToggle,
  onSelect,
}: {
  instrument: Instrument
  expanded: boolean
  activeName: string | null
  onToggle: () => void
  onSelect: (tuning: Tuning) => void
}) {
  const panelId = `presets-${instrument}`
  return (
    <div
      className={expanded ? 'instrument-group instrument-group-open' : 'instrument-group'}
    >
      <InstrumentHeader
        instrument={instrument}
        expanded={expanded}
        activeName={activeName}
        panelId={panelId}
        onToggle={onToggle}
      />
      <div className="instrument-panel-inner">
        <InstrumentPresetPanel
          instrument={instrument}
          collapsed={!expanded}
          onSelect={onSelect}
        />
      </div>
    </div>
  )
}

function InstrumentPresetList({
  activeTuning,
  onSelect,
}: {
  activeTuning: Tuning
  onSelect: (tuning: Tuning) => void
}) {
  const { expanded, toggle } = useExpandedInstrument(activeTuning.instrument)

  return (
    <div className="instrument-list">
      {INSTRUMENTS.map((instrument) => (
        <InstrumentPresetGroup
          key={instrument}
          instrument={instrument}
          expanded={expanded === instrument}
          activeName={activeTuning.instrument === instrument ? activeTuning.name : null}
          onToggle={() => {
            toggle(instrument)
          }}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

export function PresetPicker({
  customTunings,
  activeTuning,
  canSaveDraft,
  onSelect,
  onSaveDraft,
  onDeleteCustom,
  onRenameCustom,
  onClose,
}: PresetPickerProps) {
  const myTunings = useMemo(
    () => mergePickerTunings(customTunings, activeTuning),
    [activeTuning, customTunings],
  )

  return (
    <Sheet onClose={onClose} tall>
      <h2>{UI.tunings}</h2>
      {canSaveDraft && (
        <>
          <h3>{UI.saveCurrent}</h3>
          <SaveDraftField onSave={onSaveDraft} />
        </>
      )}
      <CustomTuningList
        tunings={myTunings}
        showEmptyHint={!appearsInPicker(activeTuning)}
        onSelect={onSelect}
        onDelete={onDeleteCustom}
        onRename={onRenameCustom}
      />
      <InstrumentPresetList activeTuning={activeTuning} onSelect={onSelect} />
    </Sheet>
  )
}
