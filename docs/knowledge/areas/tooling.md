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
| `check`                      | lint + format:check + typecheck + unit tests + knowledge:check  |
| `test` / `test:watch`        | Vitest                                                          |
| `test:e2e` / `test:e2e:live` | Playwright                                                      |
| `knowledge:refresh`          | Regenerate auto file inventory in `file-index.md`               |
| `knowledge:check`            | Validate knowledge graph / index / file coverage                |
| `knowledge:wiki`             | Mirror `docs/knowledge` → GitHub Wiki                           |
| `knowledge:notion`           | Mirror `docs/knowledge` → Notion Wiki (`NOTION_API_KEY`)        |
| `knowledge:sync`             | GitHub Wiki + Notion Wiki                                       |

## Config files

| File                                                         | Notes                                                                                                                   |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `vite.config.ts`                                             | `base: '/anystring/'` (`./` when `CAP_BUILD=1`), PWA precache all assets, `__APP_VERSION__` define, Vitest excludes e2e |
| `capacitor.config.ts`                                        | `com.badkirill.anystring`, app name, `webDir: 'dist'`                                                                   |
| `tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json` | Project references; strict app                                                                                          |
| `eslint.config.js`                                           | strictTypeChecked + sonarjs + core portability                                                                          |
| `.prettierrc` / `.prettierignore`                            | Format ownership                                                                                                        |
| `playwright.config.ts`                                       | E2E; live URL override via env                                                                                          |
| `index.html`                                                 | SPA shell                                                                                                               |
| `scripts/generate-icons.mjs`                                 | PWA icons plus iOS/Android app icons and splash screens                                                                 |
| `scripts/refresh-file-index.mjs`                             | Auto file inventory                                                                                                     |
| `scripts/check-knowledge.mjs`                                | Knowledge integrity                                                                                                     |
| `scripts/sync-knowledge-wiki.mjs`                            | GitHub Wiki mirror                                                                                                      |
| `scripts/sync-notion-wiki.mjs`                               | Notion Wiki mirror                                                                                                      |

## PWA

`vite-plugin-pwa`: standalone, portrait, dark theme `#0d1412`, autoUpdate SW,
offline precache. Icons under `public/`.

## Open when

Changing build base path, PWA manifest, TS/ESLint tooling, or npm scripts.

## See also

- [ci-cd.md](ci-cd.md) · [patterns-and-rules.md](patterns-and-rules.md) ·
  [native-shell.md](native-shell.md)
