import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { installAppResumeHandlers } from './audio/appResume'
import './index.css'
import App from './App.tsx'

/** Kept in step with the fade in the inline splash styles in index.html. */
const SPLASH_FADE_MS = 240

/** Hands the launch cover over to the app once React has painted a frame. */
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
