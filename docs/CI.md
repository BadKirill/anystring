# CI/CD pipeline

Every push and pull request runs the **CI** workflow with five separate checks visible in GitHub:

| Job                    | What it runs                          |
| ---------------------- | ------------------------------------- |
| Lint (ESLint)          | `npm run lint`                        |
| Format (Prettier)      | `npm run format:check`                |
| Typecheck (TypeScript) | `npm run typecheck`                   |
| Unit tests (Vitest)    | `npm run test`                        |
| Knowledge graph        | `npm run knowledge:check`             |
| E2E (Playwright local) | `npm run test:e2e` against dev server |

Pushes to `master` that touch `docs/knowledge/**` do **not** auto-sync external
wikis. GitHub/Notion wiki sync is manual (`workflow_dispatch` only). Local
`knowledge:check` still runs on every PR.

Pushes to `master` also run the **Deploy** workflow:

| Job                   | What it runs                                                         |
| --------------------- | -------------------------------------------------------------------- |
| Build (Vite)          | `npm run build` → upload Pages artifact                              |
| Deploy (GitHub Pages) | Publish to https://badkirill.github.io/anystring/                    |
| UI check (live site)  | `npm run test:e2e:live` — Playwright smoke tests on the deployed URL |

## UI check after deploy

The **UI check (live site)** job is the automated equivalent of a Cursor browser MCP review:

- Opens the real deployed app in headless Chromium (mobile viewport)
- Verifies the page loads, controls are visible, tuning picker works, string gauges render
- Runs automatically after every successful deploy — no manual step

Locally you can run the same check:

```bash
PLAYWRIGHT_BASE_URL=https://badkirill.github.io npm run test:e2e:live
```

For interactive visual review in Cursor, use the **cursor-ide-browser** MCP (`browser_navigate`, `browser_snapshot`, `browser_take_screenshot`) against the live URL or `npm run dev`.

## Branch protection (recommended)

In GitHub → Settings → Branches → Add rule for `master`:

- Require status checks: all five CI jobs before merge
- Optional: require Deploy UI check to pass (only runs after merge to master)
