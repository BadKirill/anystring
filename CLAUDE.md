# Claude / coding-agent entry

Follow [`AGENTS.md`](AGENTS.md) and the portable protocol
[`docs/knowledge/AGENT_PROTOCOL.md`](docs/knowledge/AGENT_PROTOCOL.md).

For any code change: start at [`docs/knowledge/INDEX.md`](docs/knowledge/INDEX.md),
read only matching area pages, then touch listed files. After structural changes
run `npm run knowledge:refresh`, update area docs, and `npm run knowledge:check`.
External Wiki (GitHub/Notion) only on explicit user request, with read-back.
No wiki sync automation on commit/PR.
