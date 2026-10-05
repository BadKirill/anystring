export interface OpenSession {
  startedAt: number
  inTune: boolean
}

export interface EndedSession {
  seconds: number
  inTune: boolean
}

export interface SessionInput {
  listening: boolean
  inTune: boolean
  now: number
}

export interface SessionStep {
  session: OpenSession | null
  ended: EndedSession | null
}

export function stepSession(
  session: OpenSession | null,
  input: SessionInput,
): SessionStep {
  if (session === null) {
    if (!input.listening) {
      return { session: null, ended: null }
    }
    return { session: { startedAt: input.now, inTune: input.inTune }, ended: null }
  }
  if (input.listening) {
    return {
      session: { startedAt: session.startedAt, inTune: session.inTune || input.inTune },
      ended: null,
    }
  }
  return {
    session: null,
    ended: { seconds: (input.now - session.startedAt) / 1000, inTune: session.inTune },
  }
}
