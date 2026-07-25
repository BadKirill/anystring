import type { Pitch } from '../core/music'
import type { Tuning } from '../core/tunings'
import {
  appearsInPicker,
  belongsInMyTunings,
  isDraftTuning,
  isSavedCustomTuning,
  isUnmodifiedPreset,
} from '../core/tunings/custom'

const LIST_KEY = 'anystring.v2.customTunings'
const ACTIVE_KEY = 'anystring.v2.activeTuning'
const LIST_SESSION_KEY = 'anystring.v2.customTunings.session'
const ACTIVE_SESSION_KEY = 'anystring.v2.activeTuning.session'

// Pre-rename keys: users who installed the PWA as "anytune" keep their tunings.
const LEGACY_LIST_KEYS = ['anytune.v2.customTunings', 'anytune.customTunings']
const LEGACY_LIST_SESSION_KEYS = [
  'anytune.v2.customTunings.session',
  'anytune.customTunings.session',
]
const LEGACY_ACTIVE_KEYS = ['anytune.v2.activeTuning', 'anytune.lastActiveTuning']
const LEGACY_ACTIVE_SESSION_KEYS = [
  'anytune.v2.activeTuning.session',
  'anytune.lastActiveTuning.session',
]
const ACTIVE_KEYS = [
  ACTIVE_KEY,
  ACTIVE_SESSION_KEY,
  ...LEGACY_ACTIVE_KEYS,
  ...LEGACY_ACTIVE_SESSION_KEYS,
]

interface TuningListFile {
  v: 2
  tunings: Tuning[]
}

function parseOctave(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function normalizeString(value: unknown): Tuning['strings'][number] | null {
  if (!value || typeof value !== 'object') {
    return null
  }
  const pitch = (value as { pitch?: { note?: unknown; octave?: unknown } }).pitch
  if (typeof pitch?.note !== 'string') {
    return null
  }
  const octave = parseOctave(pitch.octave)
  if (octave === null) {
    return null
  }
  return { pitch: { note: pitch.note as Pitch['note'], octave } }
}

/** Repairs common storage glitches before a tuning is used. */
export function normalizeTuning(value: unknown): Tuning | null {
  if (!value || typeof value !== 'object') {
    return null
  }
  const tuning = value as Partial<Tuning>
  if (
    typeof tuning.id !== 'string' ||
    typeof tuning.name !== 'string' ||
    (tuning.instrument !== 'guitar' && tuning.instrument !== 'bass') ||
    !Array.isArray(tuning.strings) ||
    tuning.strings.length === 0
  ) {
    return null
  }

  const strings = tuning.strings
    .map(normalizeString)
    .filter((entry): entry is Tuning['strings'][number] => entry !== null)
  if (strings.length === 0) {
    return null
  }

  return {
    id: tuning.id,
    name: tuning.name,
    instrument: tuning.instrument,
    strings,
  }
}

function readRaw(storage: Storage, key: string): unknown {
  try {
    const raw = storage.getItem(key)
    return raw ? (JSON.parse(raw) as unknown) : null
  } catch {
    return null
  }
}

function writeRaw(storage: Storage, key: string, value: unknown): void {
  try {
    storage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage may be blocked on some mobile browsers until a user gesture.
  }
}

function tuningsFromRaw(raw: unknown): Tuning[] {
  if (!raw) {
    return []
  }
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as Partial<TuningListFile>).tunings)
      ? (raw as Partial<TuningListFile>).tunings
      : null
  if (!list) {
    return []
  }
  return list
    .map(normalizeTuning)
    .filter((entry): entry is Tuning => entry !== null)
    .map(ensureStoredId)
    .filter(belongsInMyTunings)
}

function tuningFingerprint(tuning: Tuning): string {
  return `${tuning.instrument}|${tuning.name}|${tuning.strings
    .map((string) => `${string.pitch.note}:${String(string.pitch.octave)}`)
    .join('|')}`
}

function dedupeTuningList(tunings: Tuning[]): Tuning[] {
  const byFingerprint = new Map<string, Tuning>()
  for (const tuning of tunings) {
    if (!belongsInMyTunings(tuning)) {
      continue
    }
    const stored = ensureStoredId(tuning)
    byFingerprint.set(tuningFingerprint(stored), stored)
  }
  return [...byFingerprint.values()]
}

function ensureStoredId(tuning: Tuning): Tuning {
  if (isDraftTuning(tuning) || isUnmodifiedPreset(tuning)) {
    return tuning
  }
  if (tuning.id.startsWith('custom-') || isSavedCustomTuning(tuning)) {
    return tuning
  }
  return { ...tuning, id: createCustomId() }
}

function writeTuningList(tunings: Tuning[]): void {
  const file: TuningListFile = { v: 2, tunings: dedupeTuningList(tunings) }
  writeRaw(localStorage, LIST_KEY, file)
  writeRaw(sessionStorage, LIST_SESSION_KEY, file)
}

function absorbTunings(merged: Map<string, Tuning>, raw: unknown): void {
  for (const tuning of tuningsFromRaw(raw)) {
    merged.set(tuningFingerprint(tuning), tuning)
  }
}

function absorbActiveTunings(merged: Map<string, Tuning>): void {
  for (const storage of [localStorage, sessionStorage]) {
    for (const key of ACTIVE_KEYS) {
      const parsed = normalizeTuning(readRaw(storage, key))
      if (parsed && appearsInPicker(parsed)) {
        const stored = ensureStoredId(parsed)
        merged.set(tuningFingerprint(stored), stored)
      }
    }
  }
}

function absorbLegacyLists(merged: Map<string, Tuning>): void {
  for (const key of LEGACY_LIST_KEYS) {
    absorbTunings(merged, readRaw(localStorage, key))
  }
  for (const key of LEGACY_LIST_SESSION_KEYS) {
    absorbTunings(merged, readRaw(sessionStorage, key))
  }
}

function readTuningListSourcesOnly(): Tuning[] {
  const merged = new Map<string, Tuning>()
  absorbTunings(merged, readRaw(localStorage, LIST_KEY))
  absorbTunings(merged, readRaw(sessionStorage, LIST_SESSION_KEY))
  absorbLegacyLists(merged)
  absorbActiveTunings(merged)
  return [...merged.values()]
}

function ensureListed(tuning: Tuning): void {
  if (!belongsInMyTunings(tuning)) {
    return
  }
  const stored = ensureStoredId(tuning)
  const listed = readTuningListSourcesOnly()
  if (listed.some((entry) => tuningFingerprint(entry) === tuningFingerprint(stored))) {
    return
  }
  writeTuningList([...listed, stored])
}

function syncActiveIntoList(): void {
  for (const storage of [localStorage, sessionStorage]) {
    const active =
      readStoredActive(storage, ACTIVE_KEY) ??
      readStoredActive(storage, ACTIVE_SESSION_KEY)
    if (active) {
      ensureListed(active)
      return
    }
  }
  const legacy = readLegacyActive()
  if (legacy) {
    ensureListed(legacy)
  }
}

function readTuningList(): Tuning[] {
  syncActiveIntoList()
  const result = readTuningListSourcesOnly()
  const hasV2List = readRaw(localStorage, LIST_KEY) !== null
  if (result.length > 0 && !hasV2List) {
    writeTuningList(result)
  }
  return result
}

function readLegacyActive(): Tuning | null {
  const keys = [...LEGACY_ACTIVE_KEYS, ...LEGACY_ACTIVE_SESSION_KEYS]
  for (const storage of [localStorage, sessionStorage]) {
    for (const key of keys) {
      const parsed = normalizeTuning(readRaw(storage, key))
      if (parsed && belongsInMyTunings(parsed)) {
        return ensureStoredId(parsed)
      }
    }
  }
  return null
}

function clearActiveTuning(): void {
  for (const storage of [localStorage, sessionStorage]) {
    for (const key of ACTIVE_KEYS) {
      storage.removeItem(key)
    }
  }
}

function activeTuningId(): string | null {
  for (const storage of [localStorage, sessionStorage]) {
    for (const key of ACTIVE_KEYS) {
      const parsed = readStoredActive(storage, key)
      if (parsed) {
        return parsed.id
      }
    }
  }
  return null
}

/** All user-saved custom tunings from storage. */
export function readCustomTunings(): Tuning[] {
  return readTuningList()
}

/** Saves or replaces one custom tuning and marks it active. */
export function saveCustomTuning(tuning: Tuning): void {
  const stored = ensureStoredId(tuning)
  if (!belongsInMyTunings(stored)) {
    return
  }
  const next = [...readTuningList().filter((entry) => entry.id !== stored.id), stored]
  writeTuningList(next)
  writeActiveTuning(stored)
}

/** Removes a saved custom tuning. */
export function deleteCustomTuning(id: string): void {
  if (activeTuningId() === id) {
    clearActiveTuning()
  }
  writeTuningList(readTuningListSourcesOnly().filter((entry) => entry.id !== id))
}

/** Renames a saved custom tuning. */
export function renameCustomTuning(id: string, name: string): Tuning | null {
  const existing = readTuningList().find((entry) => entry.id === id)
  if (!existing) {
    return null
  }
  const updated: Tuning = { ...existing, name }
  saveCustomTuning(updated)
  return updated
}

function readStoredActive(storage: Storage, key: string): Tuning | null {
  const parsed = normalizeTuning(readRaw(storage, key))
  if (!parsed || !belongsInMyTunings(parsed)) {
    return null
  }
  return ensureStoredId(parsed)
}

/** Last selected custom tuning, if any. */
export function readActiveTuning(): Tuning | null {
  for (const storage of [localStorage, sessionStorage]) {
    const active =
      readStoredActive(storage, ACTIVE_KEY) ??
      readStoredActive(storage, ACTIVE_SESSION_KEY)
    if (active) {
      return active
    }
  }
  const legacy = readLegacyActive()
  if (!legacy) {
    return null
  }
  saveCustomTuning(legacy)
  return legacy
}

/** Remembers which custom tuning is currently selected. */
export function writeActiveTuning(tuning: Tuning): void {
  const stored = ensureStoredId(tuning)
  if (!belongsInMyTunings(stored)) {
    clearActiveTuning()
    return
  }
  writeRaw(localStorage, ACTIVE_KEY, stored)
  writeRaw(sessionStorage, ACTIVE_SESSION_KEY, stored)
}

/** Ensures a tuning is written to the saved list (e.g. before opening the picker). */
export function persistTuningToList(tuning: Tuning): void {
  if (!appearsInPicker(tuning)) {
    return
  }
  ensureListed(ensureStoredId(tuning))
}

/** Merges stored tunings with the live selection for the picker. */
export function mergePickerTunings(saved: Tuning[], active: Tuning): Tuning[] {
  persistTuningToList(active)
  const entries = [...saved]
  if (appearsInPicker(active)) {
    entries.push(ensureStoredId(active))
  }
  return dedupeTuningList(entries)
}

/** Adds or replaces one tuning in an in-memory list. */
export function upsertInList(list: Tuning[], tuning: Tuning): Tuning[] {
  const stored = ensureStoredId(tuning)
  if (!appearsInPicker(stored)) {
    return list
  }
  return dedupeTuningList([...list.filter((entry) => entry.id !== stored.id), stored])
}

export function createCustomId(): string {
  return `custom-${String(Date.now())}`
}
