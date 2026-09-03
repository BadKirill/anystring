type ResumeHandler = () => void | Promise<void>

const handlers = new Set<ResumeHandler>()
let installed = false
let resumePending = false

export function onAppResume(handler: ResumeHandler): () => void {
  handlers.add(handler)
  return () => {
    handlers.delete(handler)
  }
}

async function notifyResume(): Promise<void> {
  if (resumePending) {
    return
  }
  resumePending = true
  try {
    for (const handler of handlers) {
      await handler()
    }
  } finally {
    resumePending = false
  }
}

export function installAppResumeHandlers(): void {
  if (installed) {
    return
  }
  installed = true

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      void notifyResume()
    }
  })

  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      void notifyResume()
    }
  })
}
