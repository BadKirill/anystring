export const REVIEW_AFTER_SESSIONS = 3
export const REVIEW_COOLDOWN_MS = 90 * 24 * 60 * 60 * 1000

export interface ReviewRequest {
  at: number
  version: string
}

export interface ReviewState {
  successfulSessions: number
  lastRequest: ReviewRequest | null
}

export const INITIAL_REVIEW_STATE: ReviewState = {
  successfulSessions: 0,
  lastRequest: null,
}

export function recordSuccessfulSession(state: ReviewState): ReviewState {
  return { ...state, successfulSessions: state.successfulSessions + 1 }
}

export function markReviewRequested(
  state: ReviewState,
  at: number,
  version: string,
): ReviewState {
  return { ...state, successfulSessions: 0, lastRequest: { at, version } }
}

export type ReviewPrompt = 'native' | 'web' | 'none'

export function promptAfterSuccess(
  state: ReviewState,
  now: number,
  version: string,
  surface: 'native' | 'web',
): { state: ReviewState; prompt: ReviewPrompt } {
  const counted = recordSuccessfulSession(state)
  if (!shouldRequestReview(counted, now, version)) {
    return { state: counted, prompt: 'none' }
  }
  return {
    state: markReviewRequested(counted, now, version),
    prompt: surface,
  }
}

export function shouldRequestReview(
  state: ReviewState,
  now: number,
  version: string,
): boolean {
  if (state.successfulSessions < REVIEW_AFTER_SESSIONS) {
    return false
  }
  if (state.lastRequest === null) {
    return true
  }
  if (state.lastRequest.version === version) {
    return false
  }
  return now - state.lastRequest.at >= REVIEW_COOLDOWN_MS
}

function isReviewRequest(value: unknown): value is ReviewRequest {
  if (!value || typeof value !== 'object') {
    return false
  }
  const request = value as { at?: unknown; version?: unknown }
  return typeof request.at === 'number' && typeof request.version === 'string'
}

export function isReviewState(value: unknown): value is ReviewState {
  if (!value || typeof value !== 'object') {
    return false
  }
  const state = value as { successfulSessions?: unknown; lastRequest?: unknown }
  if (
    typeof state.successfulSessions !== 'number' ||
    !Number.isInteger(state.successfulSessions) ||
    state.successfulSessions < 0
  ) {
    return false
  }
  return state.lastRequest === null || isReviewRequest(state.lastRequest)
}
