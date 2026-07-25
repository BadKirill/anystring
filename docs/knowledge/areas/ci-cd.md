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
`npm run knowledge:wiki` with `GITHUB_TOKEN`.

## Deploy (`deploy.yml`) — push to `master`

1. Build Vite → Pages artifact (`base: /anystring/`)
2. Deploy GitHub Pages → https://badkirill.github.io/anystring/
3. Live UI smoke — `npm run test:e2e:live`

## Agent notes

- Do not merge with failing CI checks.
- `npm run knowledge:check` is part of `npm run check` (graph/index integrity).
- Wiki sync is **not** a CI job; agents run `npm run knowledge:wiki` after catalog
  updates (requires wiki write access).

## Open when

Changing workflows, Node version, Pages base path, or check matrix.

## See also

- [testing.md](testing.md) · [tooling.md](tooling.md)
