import { Sheet } from './Sheet'
import { UI } from './strings'

const REPO_URL = 'https://github.com/BadKirill/anystring'

const LINKS = [
  {
    label: UI.aboutPrivacyLink,
    href: 'https://badkirill.github.io/anystring/privacy.html',
  },
  { label: UI.aboutSupportLink, href: `${REPO_URL}/issues` },
  { label: UI.aboutSourceLink, href: REPO_URL },
]

/** Version, privacy summary, and store-required links. */
export function AboutSheet({ onClose }: { onClose: () => void }) {
  return (
    <Sheet onClose={onClose}>
      <h2>{UI.aboutTitle}</h2>
      <p className="about-text">{UI.aboutTagline}</p>
      <p className="about-text">{UI.aboutPrivacy}</p>
      <p className="about-version">{`${UI.aboutVersion} ${__APP_VERSION__}`}</p>
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
