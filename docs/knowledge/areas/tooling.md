# Tooling

Tags: `vite`, `pwa`, `typescript`, `npm`

## Scripts (`package.json`)

| Script                       | Purpose                                                         |
| ---------------------------- | --------------------------------------------------------------- |
| `dev`                        | Vite dev server                                                 |
| `build`                      | `tsc -b` + Vite production build                                |
| `build:native`               | Same build with `CAP_BUILD=1`: relative base, no service worker |
| `cap:sync`                   | `build:native` + `cap sync` into `ios/` and `android/`          |
| `cap:ios` / `cap:android`    | Sync, then open Xcode / Android Studio                          |
| `cap:build:ios-sim`          | Sync + Xcode Debug build for iOS Simulator                      |
| `cap:build:android-debug`    | Sync + `gradlew assembleDebug` (JDK 21 / Studio JBR)            |
| `check`                      | lint + format:check + typecheck + unit tests + knowledge:check  |
| `test` / `test:watch`        | Vitest                                                          |
| `test:e2e` / `test:e2e:live` | Playwright (store shots excluded via `testIgnore`)              |
| `test:e2e:native`            | Maestro on sim/emulator (`scripts/native-e2e.sh`)               |
| `screenshots:store`          | Playwright store PNGs (`playwright.store.config.ts`)            |
| `knowledge:refresh`          | Regenerate auto file inventory in `file-index.md`               |
| `knowledge:check`            | Validate local knowledge graph / index / file coverage          |
| `knowledge:wiki`             | Explicit: mirror → GitHub Wiki (+ read-back)                    |
| `knowledge:notion`           | Explicit: mirror → Notion Wiki (`NOTION_API_KEY`, + read-back)  |

## Config files

| File                                                         | Notes                                                                                        |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `vite.config.ts`                                             | `base: '/'` (`./` + `root: app` when `CAP_BUILD=1`), MPA landing + `/app`, PWA scope `/app/` |
| `capacitor.config.ts`                                        | `com.badkirill.anystring`, app name, `webDir: 'dist'`                                        |
| `tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json` | Project references; strict app                                                               |
| `eslint.config.js`                                           | strictTypeChecked + sonarjs + core portability                                               |
| `.prettierrc` / `.prettierignore`                            | Format ownership                                                                             |
| `playwright.config.ts`                                       | E2E; live URL override via env; ignores `e2e/store/**`                                       |
| `playwright.store.config.ts`                                 | Store screenshot viewports (iOS 6.7" + Android phone)                                        |
| `.maestro/`                                                  | Native UI flows (permissions, reference tap, backup shots)                                   |
| `index.html`                                                 | Marketing landing (web)                                                                      |
| `app/index.html`                                             | Tuner SPA shell (web `/app/` + native)                                                       |
| `public/CNAME`                                               | Custom domain `anystring.app` for GitHub Pages                                               |
| `public/privacy.html` / `public/support.html`                | Store-required static pages                                                                  |
| `store/screenshots/`                                         | App Store / Play listing PNGs                                                                |
| `scripts/generate-icons.mjs`                                 | PWA icons plus iOS/Android app icons and splash screens                                      |
| `scripts/native-e2e.sh`                                      | Capacitor debug build/install + Maestro                                                      |
| `scripts/refresh-file-index.mjs`                             | Auto file inventory                                                                          |
| `scripts/check-knowledge.mjs`                                | Knowledge integrity                                                                          |
| `scripts/sync-knowledge-wiki.mjs`                            | GitHub Wiki mirror (explicit)                                                                |
| `scripts/sync-notion-wiki.mjs`                               | Notion Wiki mirror (explicit)                                                                |

## PWA

`vite-plugin-pwa`: standalone, portrait, dark theme `#0d1412`, autoUpdate SW,
offline precache. Icons under `public/`.

## Open when

Changing build base path, PWA manifest, TS/ESLint tooling, or npm scripts.

## See also

- [ci-cd.md](ci-cd.md) · [patterns-and-rules.md](patterns-and-rules.md) ·
  [native-shell.md](native-shell.md)
