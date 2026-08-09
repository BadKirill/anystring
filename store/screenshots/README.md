# Store screenshots

Phone listing assets for App Store Connect and Google Play.

| Folder     | Logical size     | Notes                            |
| ---------- | ---------------- | -------------------------------- |
| `ios/`     | 1290×2796 (6.7") | Playwright viewport 430×932 @3x  |
| `android/` | 1080×1920 (9:16) | Playwright viewport 432×768 @2.5 |

Regenerate:

```bash
npm run screenshots:store
```

Scenes: idle, strings in-tune / flat / sharp, chromatic, presets, note picker.

Native Maestro backup shots (optional): `maestro test .maestro/screenshots.yaml` after installing a debug build.
