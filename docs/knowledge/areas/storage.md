# Storage

Tags: `storage`, `localStorage`, `persist`, `migrate`  
Path: `src/storage/`

## Role

Persist custom tunings and last active tuning. Dual-write localStorage +
sessionStorage with legacy key absorption.

## Keys (v2)

| Key                                                                        | Purpose                       |
| -------------------------------------------------------------------------- | ----------------------------- |
| `anystring.v2.customTunings`                                               | `{ v: 2, tunings: Tuning[] }` |
| `anystring.v2.activeTuning`                                                | Active `Tuning` JSON          |
| `anystring.v2.customTunings.session` / `anystring.v2.activeTuning.session` | Same in sessionStorage        |

Legacy absorbed (pre-rename and pre-v2): `anytune.v2.customTunings`,
`anytune.v2.activeTuning`, `anytune.customTunings`, `anytune.lastActiveTuning`
(+ `.session` variants). Reading any of them rewrites the data under the
`anystring.*` keys.

## Public API (`customTuningsStore.ts`)

`normalizeTuning`, `readCustomTunings`, `saveCustomTuning`, `deleteCustomTuning`,
`renameCustomTuning`, `readActiveTuning`, `writeActiveTuning`, `persistTuningToList`,
`mergePickerTunings`, `upsertInList`, `createCustomId`

## Internal flow (read path)

1. `readTuningListSourcesOnly` merges v2 local + session + legacy list keys.
2. `absorbActiveTunings` also pulls active/legacy active into the merge map.
3. Entries pass `normalizeTuning` → `ensureStoredId` → `belongsInMyTunings`.
4. Dedupe key = fingerprint: `instrument|name|note:octave|...`.
5. `readCustomTunings` / list writers call `syncActiveIntoList` so a saved-looking
   active tuning is not orphaned from My tunings.

## Write / id rules

- List file always `{ v: 2, tunings }` via `writeTuningList` (both storages).
- `ensureStoredId`: drafts and unmodified presets keep ids; others get `custom-*`
  if missing.
- `writeRaw` swallows quota/blocked storage errors (mobile until gesture).
- Membership / picker visibility comes from `core/tunings/custom`, not duplicated here.

## Patterns

- Validate before use (`normalizeTuning`).
- Tests: in-memory `Storage` fake in `customTuningsStore.test.ts`.

## Open when

Persistence bugs, migration, picker missing rows, id collisions, key version bumps.
Bump schema `v` carefully and document here + CATALOG.

## See also

- [core-tunings.md](core-tunings.md) — draft / My tunings predicates
- [state.md](state.md) — save/delete/rename wiring
- [components.md](components.md) — PresetPicker / CustomTuningList
