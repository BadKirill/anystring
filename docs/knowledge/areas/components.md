# Components / UI

Tags: `ui`, `gauge`, `picker`, `sheet`, `strings`, `chromatic`, `splash`  
Paths: `src/components/`, `src/App.tsx`, `src/App.css`, `src/index.css`, `index.html`

## Composition

`App.tsx` owns modal union (`none` | `presets` | `edit`) and screen tabs
(`strings` | `chromatic`).

**Strings:** Header (title + tuning name + About) → ScreenTabs → ModeControls
(Auto + Listen) → TunerGauge → TuneDirectionHint → StringList → InstallHint →
modals.

**Chromatic:** Header (title + Chromatic label + About) → ScreenTabs → Listen only →
TunerGauge (♭/# marks, live cents, no latch-to-center) → hint with cents /
flat·sharp. No StringList, Auto, or tuning picker.

## Launch cover

`index.html` ships the cover markup plus inlined styles so it paints on the
first frame; `main.tsx` fades `#splash` out after React's first paint. The mark
is sized to `30vh` because `ios/App/App/Base.lproj/LaunchScreen.storyboard`
renders the same art at 30% of screen height, so the native launch image hands
over without a jump — and without the black gap that used to sit between them.

## Components

| File                                           | Role                                                                   |
| ---------------------------------------------- | ---------------------------------------------------------------------- |
| `TunerGauge.tsx`                               | SVG needle ±50¢, green in-tune                                         |
| `StringList.tsx`                               | One-row string buttons + thickness gauge; overflow swipes              |
| `stringRailOverflow.ts`                        | Overflow metrics for the string rail                                   |
| `reviveOverflowScroll.ts`                      | Re-enable WebView overflow after Android recents/resume                |
| `TuneDirectionHint.tsx`                        | Direction / idle / mic error copy (string + chromatic)                 |
| `PresetPicker.tsx`                             | Instrument cards + nested presets + My tunings + save draft            |
| `CustomTuningList.tsx` / `CustomTuningRow.tsx` | Saved customs: rename/delete/swipe                                     |
| `NotePicker.tsx`                               | Note + octave chips in Sheet; plays a reference tone per pick          |
| `Sheet.tsx`                                    | Bottom sheet modal shell                                               |
| `SwipeableRow.tsx` + `useSwipeOffset.ts`       | Reveal edit/delete actions                                             |
| `TextField.tsx`                                | Named input for save/rename                                            |
| `InstallHint.tsx`                              | iOS add-to-home; dismissed via localStorage, hidden on native          |
| `AboutSheet.tsx`                               | Version from installed binary (native) or bundled `package.json` (web) |
| `useLockBodyScroll.ts`                         | Lock scroll when sheet open                                            |
| `strings.ts`                                   | **All** user-facing English strings (`UI`)                             |

## Patterns

- Touch-first chips/buttons; dark theme in CSS.
- Localization-ready: never hardcode user copy outside `strings.ts`.
- Presentational components; side effects live in state/audio/storage.
- Screen tabs reuse `.chip` / `.chip-selected`.
- Preset picker: each instrument is a card. Tapping it expands **that** card’s
  background around its presets (`height: 0` → `auto`), so tunings sit
  visually inside the instrument as raised chips, not in a shared list below. One instrument
  expanded (`activeTuning.instrument` after first paint); tapping another header
  leaves the first open. Tapping an open header collapses only that card.
  My tunings stays expanded. Sheet children do not flex-shrink, so
  empty-state copy cannot sit under headers.
- String rail: after the app returns from the background, `reviveOverflowScroll`
  toggles overflow so Chromium/WebView swipe scrolling starts again.

## Open when

Layout, gauge feel, screen tabs, picker lists, swipe UX, install hint, copy,
launch cover.

## See also

- [state.md](state.md) · [core-tunings.md](core-tunings.md) · UI copy in `src/components/strings.ts`
