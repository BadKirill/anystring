# CI/CD

Tags: `ci`, `deploy`, `pages`, `github-actions`  
Docs: `docs/CI.md` · Workflows: `.github/workflows/`

## CI (`ci.yml`) — every push/PR

Separate GitHub checks:

1. Lint — `npm run lint`
2. Format — `npm run format:check`
3. Typecheck — `npm run typecheck`
4. Unit tests — `npm run test`
5. Knowledge graph — `npm run knowledge:check` (local snapshot only)
6. E2E local — `npm run test:e2e`

External Wiki sync is **not** run on push/PR. Manual
`workflow_dispatch` only (`.github/workflows/knowledge-wiki.yml`).

## Deploy (`deploy.yml`) — push to `master`

1. Build Vite → Pages artifact (`base: /`, landing + `/app` tuner)
2. Deploy GitHub Pages → https://anystring.app/
3. Live UI smoke — `npm run test:e2e:live`

## Agent notes

- Do not merge with failing CI checks.
- After structural changes: update **local** `docs/knowledge/` + `knowledge:check`.
- Notion / GitHub Wiki: only on explicit user request, then read-back.
- No commit/PR automation for external wikis.

## Open when

Changing workflows, Node version, Pages base path, or check matrix.

## See also

- [testing.md](testing.md) · [tooling.md](tooling.md)
