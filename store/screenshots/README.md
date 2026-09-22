# Store screenshots

Phone listing assets for App Store Connect and Google Play. Each PNG is a
marketing frame: headline that names the feature, then a rounded phone with
the live app UI (stub microphone so pitch is deterministic).

| Folder     | Logical size     | Notes                            |
| ---------- | ---------------- | -------------------------------- |
| `ios/`     | 1290×2796 (6.7") | Playwright viewport 430×932 @3x  |
| `android/` | 1080×1920 (9:16) | Playwright viewport 432×768 @2.5 |

Regenerate:

```bash
npm run screenshots:store
```

Scenes (01–07): auto-detect in tune, chromatic cents, guitar/bass/ukulele
presets, note picker + reference tone, My tunings, tighten/loosen, Drop D.

Native Maestro backup shots (optional, unframed UI): `maestro test .maestro/screenshots.yaml` after installing a debug build.
