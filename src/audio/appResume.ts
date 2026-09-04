export interface AppResumeInfo {
  readonly hiddenMs: number
}

type ResumeHandler = (info: AppResumeInfo) => void | Promise<void>

const UNKNOWN_HIDDEN_MS = Number.POSITIVE_INFINITY

const handlers = new Set<ResumeHandler>()
let installed = false
let resumePending = false
let hiddenSinceMs: number | null = null

export function onAppResume(handler: ResumeHandler): () => void {
  handlers.add(handler)
  return () => {
    handlers.delete(handler)
  }
}

async function notifyResume(info: AppResumeInfo): Promise<void> {
  if (resumePending) {
    return
  }
  resumePending = true
  try {
    for (const handler of handlers) {
      await handler(info)
    }
  } finally {
    resumePending = false
  }
}

function markHidden(): void {
  hiddenSinceMs ??= Date.now()
}

function takeHiddenMs(): number {
  if (hiddenSinceMs === null) {
    return 0
  }
  const hiddenMs = Date.now() - hiddenSinceMs
  hiddenSinceMs = null
  return hiddenMs
}

export function installAppResumeHandlers(): void {
  if (installed) {
    return
  }
  installed = true

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      markHidden()
      return
    }
    void notifyResume({ hiddenMs: takeHiddenMs() })
  })

  window.addEventListener('pagehide', markHidden)

  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      hiddenSinceMs = null
      void notifyResume({ hiddenMs: UNKNOWN_HIDDEN_MS })
    }
  })
}
