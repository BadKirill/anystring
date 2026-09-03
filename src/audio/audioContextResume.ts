const RESUME_TIMEOUT_MS = 1500

/** Background time after which an audio graph is assumed dead and gets rebuilt. */
export const STALE_BACKGROUND_MS = 30_000

export interface ResumableContext {
  readonly state: AudioContextState
  resume: () => Promise<void>
}

function isRunning(context: ResumableContext): boolean {
  return context.state === 'running'
}

async function resumeWithinTimeout(
  context: ResumableContext,
  timeoutMs: number,
): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const expiry = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      reject(new Error('AudioContext.resume() timed out'))
    }, timeoutMs)
  })
  try {
    await Promise.race([context.resume(), expiry])
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Resumes a context and reports whether it really runs. iOS can leave the
 * resume() promise pending forever after a long background, which would
 * deadlock every caller awaiting it — so the wait is always bounded.
 */
export async function resumeAudioContext(
  context: ResumableContext,
  timeoutMs = RESUME_TIMEOUT_MS,
): Promise<boolean> {
  if (context.state === 'closed') {
    return false
  }
  if (isRunning(context)) {
    return true
  }
  try {
    await resumeWithinTimeout(context, timeoutMs)
  } catch {
    return false
  }
  return isRunning(context)
}
