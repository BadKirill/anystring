import { useState } from 'react'

import {
  acceptPrivacyNotice,
  needsPrivacyNotice,
  readPrivacyAccepted,
} from '../storage/privacyNotice'
import { UI } from './strings'

const PRIVACY_POLICY_URL = 'https://anystring.app/privacy.html'

export function PrivacyNotice() {
  const [visible, setVisible] = useState(() => needsPrivacyNotice(readPrivacyAccepted()))

  if (!visible) {
    return null
  }
  return (
    <div className="privacy-notice">
      <p>{UI.privacyNotice}</p>
      <div className="privacy-notice-actions">
        <a
          className="about-link"
          href={PRIVACY_POLICY_URL}
          target="_blank"
          rel="noreferrer"
        >
          {UI.aboutPrivacyLink}
        </a>
        <button
          type="button"
          className="button-primary"
          onClick={() => {
            if (acceptPrivacyNotice()) {
              setVisible(false)
            }
          }}
        >
          {UI.privacyAgree}
        </button>
      </div>
    </div>
  )
}
