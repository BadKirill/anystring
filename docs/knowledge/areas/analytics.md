# Analytics and review prompt

Tags: `analytics`, `telemetry`, `review`, `privacy`, `opt-out`

Paths: `src/core/analytics/`, `src/core/review/`, `src/storage/telemetryStore.ts`,
`src/platform/telemetryClient.ts`, `src/platform/reviewPrompt.ts`,
`src/state/useUsageTelemetry.ts`, `src/components/ReviewPrompt.tsx`

## Intent

Measure how the tuner is used without audio, names, or ads. Ask for a store
rating after three successful sessions. Both are off-device only when the user
leaves them on; About has a toggle.

## Events (closed union)

`app.open`, `screen.view`, `mic.start`, `mic.error`, `tuning.select`,
`tuning.save`, `session.end`, `review.request`.

Custom tunings travel as `preset: "custom"` or `"draft"`. Session length is a
bucket. Locale is a language subtag. Frequencies and custom names never leave
the device.

Ingest is TelemetryDeck (`POST https://nom.telemetrydeck.com/v2/`) with a
SHA-256 client hash. App id is `__TELEMETRY_APP_ID__` from `TELEMETRYDECK_APP_ID`.
A blank id is a no-op (CI, local without secrets).

## Review

Three in-tune listen sessions → native StoreKit / Play In-App Review, or a web
banner with App Store and Play links. Same version is not asked twice. A new
version waits 90 days.

## Storage keys

| Key                              | Meaning                               |
| -------------------------------- | ------------------------------------- |
| `anystring.v2.analyticsEnabled`  | `'0'` opted out; missing or `'1'` on  |
| `anystring.v2.analyticsClientId` | random install id, hashed before send |
| `anystring.v2.reviewState`       | `{ successfulSessions, lastRequest }` |

## See also

- [storage.md](storage.md) · [state.md](state.md) · [native-shell.md](native-shell.md)
  · [components.md](components.md)
