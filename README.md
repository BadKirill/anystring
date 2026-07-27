# anystring

Free tuner for guitar and bass with **fully editable per-string tunings**.

**Live app:** https://badkirill.github.io/anystring/ — open it on your phone and
add it to the home screen to install. Deploys automatically from `master` via
GitHub Actions (see [docs/CI.md](docs/CI.md)).

Pick a preset (Standard, Drop D, Drop C#, Drop C, ...) or tap any string and set it
to any note — for example G#1 D#2 A#2 F1 to play Meshuggah's Demiurge. Then play:
the app listens through the microphone and shows how far each string is from the
target and which way to turn the peg.

One TypeScript codebase for everything: an installable Progressive Web App, and
the same bundle wrapped by Capacitor for the App Store and Google Play.

## Develop

```bash
npm install
npm run dev        # dev server
npm run check      # lint + format + typecheck + unit tests (must pass)
npm run test:e2e   # Playwright end-to-end tests (mic stubbed with an oscillator)
npm run build      # production build (dist/)
```

Requires Node 22+.

## Native builds

```bash
npm run cap:ios       # build the web bundle, sync, open Xcode
npm run cap:android   # build the web bundle, sync, open Android Studio
```

Gradle from the command line needs JDK 21 — the system JDK 17 fails with
`invalid source release: 21`:

```bash
cd android && JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" ./gradlew assembleDebug
```

App icons and splash screens for both platforms come from `public/icon.svg` via
`node scripts/generate-icons.mjs`. Details in
[docs/knowledge/areas/native-shell.md](docs/knowledge/areas/native-shell.md).

## Project structure

- `src/core/` — pure TypeScript domain logic (music math, tunings, analyzer). No React, no browser APIs; fully unit-tested.
- `src/audio/` — microphone capture (AudioWorklet) and pitch detection (pitchy, McLeod method).
- `src/components/` — UI: gauge, string list, note picker, preset picker.
- `src/state/` — tuner screen state.
- `src/storage/` — localStorage persistence of custom tunings.
- `src/platform/` — runtime checks for the Capacitor shell; `ios/` and `android/` hold the native projects.

See [docs/DEVELOPMENT_PLAN.md](docs/DEVELOPMENT_PLAN.md) for architecture decisions
and the development roadmap, and [AGENTS.md](AGENTS.md) for contributor/agent rules.

**Knowledge graph:** [docs/knowledge/AGENT_PROTOCOL.md](docs/knowledge/AGENT_PROTOCOL.md)
(all agents) · [INDEX.md](docs/knowledge/INDEX.md) · [CATALOG.md](docs/knowledge/CATALOG.md) ·
wiki https://github.com/BadKirill/anystring/wiki  
For ChatGPT without repo access: pin those three files in Project knowledge.
With Codex/repo: `AGENTS.md` is loaded first.
