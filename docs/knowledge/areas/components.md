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

| File                                           | Role                                                             |
| ---------------------------------------------- | ---------------------------------------------------------------- |
| `TunerGauge.tsx`                               | SVG needle ±50¢, green in-tune                                   |
| `StringList.tsx`                               | String buttons + thickness gauge; auto highlight / manual select |
| `TuneDirectionHint.tsx`                        | Direction / idle / mic error copy (string + chromatic)           |
| `PresetPicker.tsx`                             | Presets by instrument + My tunings + save draft                  |
| `CustomTuningList.tsx` / `CustomTuningRow.tsx` | Saved customs: rename/delete/swipe                               |
| `NotePicker.tsx`                               | Note + octave chips in Sheet                                     |
| `Sheet.tsx`                                    | Bottom sheet modal shell                                         |
| `SwipeableRow.tsx` + `useSwipeOffset.ts`       | Reveal edit/delete actions                                       |
| `TextField.tsx`                                | Named input for save/rename                                      |
| `InstallHint.tsx`                              | iOS add-to-home; dismissed via localStorage, hidden on native    |
| `AboutSheet.tsx`                               | Version, privacy summary, policy/support/source links            |
| `useLockBodyScroll.ts`                         | Lock scroll when sheet open                                      |
| `strings.ts`                                   | **All** user-facing English strings (`UI`)                       |

## Patterns

- Touch-first chips/buttons; dark theme in CSS.
- Localization-ready: never hardcode user copy outside `strings.ts`.
- Presentational components; side effects live in state/audio/storage.
- Screen tabs reuse `.chip` / `.chip-selected`.

## Open when

Layout, gauge feel, screen tabs, picker lists, swipe UX, install hint, copy,
launch cover.

## See also

- [state.md](state.md) · [core-tunings.md](core-tunings.md) · UI copy in `src/components/strings.ts`
