import { useEffect, useState } from 'react'

import {
  bundledAppVersion,
  formatAppVersion,
  installedAppVersion,
} from '../platform/appVersion'
import { Sheet } from './Sheet'
import { UI } from './strings'

const SITE_URL = 'https://anystring.app'
const REPO_URL = 'https://github.com/BadKirill/anystring'

const LINKS = [
  { label: UI.aboutPrivacyLink, href: `${SITE_URL}/privacy.html` },
  { label: UI.aboutSupportLink, href: `${SITE_URL}/support.html` },
  { label: UI.aboutSourceLink, href: REPO_URL },
]

export function AboutSheet({ onClose }: { onClose: () => void }) {
  const [label, setLabel] = useState(() => formatAppVersion(bundledAppVersion()))

  useEffect(() => {
    let alive = true
    void installedAppVersion().then((next) => {
      if (alive) setLabel(formatAppVersion(next))
    })
    return () => {
      alive = false
    }
  }, [])

  return (
    <Sheet onClose={onClose}>
      <h2>{UI.aboutTitle}</h2>
      <p className="about-text">{UI.aboutTagline}</p>
      <p className="about-text">{UI.aboutPrivacy}</p>
      <p className="about-version">{`${UI.aboutVersion} ${label}`}</p>
      <div className="about-links">
        {LINKS.map((link) => (
          <a
            key={link.href}
            className="about-link"
            href={link.href}
            target="_blank"
            rel="noreferrer"
          >
            {link.label}
          </a>
        ))}
      </div>
    </Sheet>
  )
}
