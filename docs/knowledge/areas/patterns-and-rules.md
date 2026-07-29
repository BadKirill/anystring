# Patterns & hard rules

Tags: `eslint`, `style`, `constraints`, `patterns`  
Sources: `AGENTS.md`, `.cursor/rules/code-style.md`, `eslint.config.js`

## How code is written

1. **Pure core** — domain math/models in `src/core` with colocated Vitest.
2. **Thin adapters** — mic/storage behind small modules; swappable later.
3. **Hook composition** — screen state in `useTunerState`, not global stores.
4. **Data over classes** — plain objects + functions; rare classes (`MicStreamError`, worklet).
5. **Central UI strings** — `components/strings.ts`.
6. **Why-comments only** — no narrating the obvious.
7. **Prettier formats** — never hand-format; run `npm run format`.

## Enforced limits (do not disable)

| Rule                           | Limit                                    |
| ------------------------------ | ---------------------------------------- |
| `max-lines-per-function`       | 50 (blank/comment skipped)               |
| `complexity`                   | 10                                       |
| `sonarjs/cognitive-complexity` | 10                                       |
| `max-depth`                    | 3                                        |
| TypeScript                     | strict + noUncheckedIndexedAccess (app)  |
| Imports in `src/core`          | no react / platform layers / DOM globals |

Relaxed for `*.test.ts` and `e2e/**` (length/cognitive).

## Audio invariants

- Never enable echoCancellation, noiseSuppression, autoGainControl.
- Keep 8192-sample window unless real-device evidence says otherwise.
- In-tune band: ±5 cents (`IN_TUNE_CENTS`).

## Workflow invariants

- Own branch + PR per change from latest `master`.
- `npm run check` before PR.
- No Cursor attribution in commits/PRs.
- Do not invent stack pieces without recording in `docs/DEVELOPMENT_PLAN.md`.

## Knowledge maintenance

Structural/API changes → update knowledge tree → `npm run knowledge:check` →
`npm run knowledge:sync` (GitHub Wiki **and** Notion Wiki; see INDEX.md).

## See also

- [architecture.md](architecture.md) · [tooling.md](tooling.md) · [INDEX.md](../INDEX.md)
