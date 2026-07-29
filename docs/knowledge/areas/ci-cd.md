# CI/CD

Tags: `ci`, `deploy`, `pages`, `github-actions`  
Docs: `docs/CI.md` · Workflows: `.github/workflows/`

## CI (`ci.yml`) — every push/PR

Separate GitHub checks:

1. Lint — `npm run lint`
2. Format — `npm run format:check`
3. Typecheck — `npm run typecheck`
4. Unit tests — `npm run test`
5. Knowledge graph — `npm run knowledge:check`
6. E2E local — `npm run test:e2e`

On `master` (paths under `docs/knowledge/**`): **Knowledge wiki** workflow runs
`npm run knowledge:wiki` and, when `NOTION_API_KEY` is set,
`npm run knowledge:notion`.

## Deploy (`deploy.yml`) — push to `master`

1. Build Vite → Pages artifact (`base: /anystring/`)
2. Deploy GitHub Pages → https://badkirill.github.io/anystring/
3. Live UI smoke — `npm run test:e2e:live`

## Agent notes

- Do not merge with failing CI checks.
- After structural changes agents **must** run `npm run knowledge:sync`
  (GitHub Wiki + Notion Wiki).
- Notion requires `NOTION_API_KEY` (never commit the token).
- Parent Notion page:
  https://app.notion.com/p/Anytune-Wiki-3a57e1830c32800c8d3be98bdb534bc4

## Open when

Changing workflows, Node version, Pages base path, or check matrix.

## See also

- [testing.md](testing.md) · [tooling.md](tooling.md)
