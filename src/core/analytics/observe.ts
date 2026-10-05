import { stepSession, type EndedSession, type OpenSession } from '../review/session'
import type { Instrument, Tuning } from '../tunings/types'
import {
  presetLabel,
  sessionLength,
  type AnalyticsEvent,
  type MicFailure,
  type ScreenName,
} from './events'

export interface TunerSnapshot {
  screen: ScreenName
  instrument: Instrument
  preset: string
  stringCount: number
  tuningId: string
  listening: boolean
  failure: MicFailure | null
  inTune: boolean
}

export interface ObserveState {
  snapshot: TunerSnapshot | null
  session: OpenSession | null
}

export interface ObserveResult extends ObserveState {
  events: AnalyticsEvent[]
  ended: EndedSession | null
}

export function tunerSnapshot(input: {
  screen: ScreenName
  tuning: Tuning
  listening: boolean
  failure: MicFailure | null
  inTune: boolean
}): TunerSnapshot {
  return {
    screen: input.screen,
    instrument: input.tuning.instrument,
    preset: presetLabel(input.tuning),
    stringCount: input.tuning.strings.length,
    tuningId: input.tuning.id,
    listening: input.listening,
    failure: input.failure,
    inTune: input.inTune,
  }
}

function firstOpenEvents(next: TunerSnapshot): AnalyticsEvent[] {
  const events: AnalyticsEvent[] = [{ type: 'screen.view', screen: next.screen }]
  if (next.listening) {
    events.push({ type: 'mic.start' })
  }
  if (next.failure) {
    events.push({ type: 'mic.error', failure: next.failure })
  }
  return events
}

function deltaEvents(prev: TunerSnapshot, next: TunerSnapshot): AnalyticsEvent[] {
  const events: AnalyticsEvent[] = []
  if (prev.screen !== next.screen) {
    events.push({ type: 'screen.view', screen: next.screen })
  }
  if (prev.tuningId !== next.tuningId) {
    events.push({
      type: 'tuning.select',
      instrument: next.instrument,
      preset: next.preset,
    })
  }
  if (prev.preset === 'draft' && next.preset === 'custom') {
    events.push({
      type: 'tuning.save',
      instrument: next.instrument,
      strings: next.stringCount,
    })
  }
  if (next.listening && !prev.listening) {
    events.push({ type: 'mic.start' })
  }
  if (next.failure && next.failure !== prev.failure) {
    events.push({ type: 'mic.error', failure: next.failure })
  }
  return events
}

function changeEvents(prev: TunerSnapshot | null, next: TunerSnapshot): AnalyticsEvent[] {
  return prev === null ? firstOpenEvents(next) : deltaEvents(prev, next)
}

export function observeTuner(
  previous: ObserveState,
  next: TunerSnapshot,
  now: number,
): ObserveResult {
  const events = changeEvents(previous.snapshot, next)
  const stepped = stepSession(previous.session, {
    listening: next.listening,
    inTune: next.inTune,
    now,
  })
  if (stepped.ended) {
    events.push({
      type: 'session.end',
      screen: next.screen,
      instrument: next.instrument,
      length: sessionLength(stepped.ended.seconds),
      inTune: stepped.ended.inTune,
    })
  }
  return { snapshot: next, session: stepped.session, events, ended: stepped.ended }
}
