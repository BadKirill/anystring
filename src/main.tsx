import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { installAppResumeHandlers } from './audio/appResume'
import './index.css'
import App from './App.tsx'

const SPLASH_FADE_MS = 240

function dismissSplash(): void {
  const splash = document.getElementById('splash')
  if (!splash) {
    return
  }
  splash.classList.add('splash-done')
  window.setTimeout(() => {
    splash.remove()
  }, SPLASH_FADE_MS)
}

installAppResumeHandlers()

const root = document.getElementById('root')
if (!root) {
  throw new Error('Root element #root not found')
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

requestAnimationFrame(() => {
  requestAnimationFrame(dismissSplash)
})
