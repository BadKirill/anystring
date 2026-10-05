import { APP_STORE_URL, PLAY_STORE_URL } from '../platform/storeLinks'
import { UI } from './strings'

export function ReviewPrompt({ onClose }: { onClose: () => void }) {
  return (
    <div className="review-prompt">
      <p>{UI.reviewPrompt}</p>
      <div className="review-prompt-actions">
        <a className="about-link" href={APP_STORE_URL} target="_blank" rel="noreferrer">
          {UI.reviewAppStore}
        </a>
        <a className="about-link" href={PLAY_STORE_URL} target="_blank" rel="noreferrer">
          {UI.reviewPlayStore}
        </a>
        <button type="button" className="button-secondary" onClick={onClose}>
          {UI.close}
        </button>
      </div>
    </div>
  )
}
