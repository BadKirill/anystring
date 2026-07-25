#!/usr/bin/env node
/**
 * Mirrors docs/knowledge/* into the GitHub Wiki (anystring.wiki).
 * Source of truth stays in the main repo; wiki is the human-readable external copy.
 */
import { execFileSync } from 'node:child_process'
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const KNOWLEDGE = join(ROOT, 'docs', 'knowledge')
const REPO = 'https://github.com/BadKirill/anystring'
const WIKI_SLUG = 'BadKirill/anystring.wiki.git'

function wikiRemoteUrl() {
  const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN
  if (token) {
    return `https://x-access-token:${token}@github.com/${WIKI_SLUG}`
  }
  return `https://github.com/${WIKI_SLUG}`
}

/** Stable wiki page names for awkward filenames. */
const PAGE_NAME_OVERRIDES = {
  'ci-cd.md': 'CI-CD.md',
  'patterns-and-rules.md': 'Patterns-And-Rules.md',
  'file-index.md': 'File-Index.md',
}

/** Wiki pages we manage; anything else .md (except kept) is removed on sync. */
const KEEP_WIKI_FILES = new Set(['_Footer.md'])

function run(cmd, args, cwd) {
  execFileSync(cmd, args, { cwd, stdio: 'inherit' })
}

function runCapture(cmd, args, cwd = ROOT, opts = {}) {
  return execFileSync(cmd, args, {
    cwd,
    encoding: 'utf8',
    stdio: opts.quiet ? ['ignore', 'pipe', 'ignore'] : undefined,
  }).trim()
}

function titleFromAreaFile(name) {
  if (PAGE_NAME_OVERRIDES[name]) {
    return PAGE_NAME_OVERRIDES[name]
  }
  return `${basename(name, '.md')
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('-')}.md`
}

function wikiPageStem(areaFile) {
  return basename(titleFromAreaFile(areaFile), '.md')
}

function sourceBlobUrl(sourceRel) {
  const candidates = []
  try {
    candidates.push(
      runCapture('git', ['rev-parse', '--abbrev-ref', 'origin/HEAD']).replace(
        /^origin\//,
        '',
      ),
    )
  } catch {
    // origin/HEAD unset; main() tries to fix
  }
  candidates.push(runCapture('git', ['rev-parse', '--abbrev-ref', 'HEAD']))
  for (const branch of candidates) {
    try {
      runCapture('git', ['cat-file', '-e', `origin/${branch}:${sourceRel}`], ROOT, {
        quiet: true,
      })
      return `${REPO}/blob/${branch}/${sourceRel}`
    } catch {
      // try next candidate
    }
  }
  return null
}

function rewriteLinksForWiki(body) {
  return body
    .replace(/\]\(areas\/([a-z0-9-]+)\.md\)/g, (_m, stem) => {
      return `](${wikiPageStem(`${stem}.md`)})`
    })
    .replace(/\]\(\.\.\/CATALOG\.md\)/g, '](Home)')
    .replace(/\]\(CATALOG\.md\)/g, '](Home)')
    .replace(/\]\(\.\.\/INDEX\.md\)/g, '](Agent-Index)')
    .replace(/\]\(INDEX\.md\)/g, '](Agent-Index)')
    .replace(/\]\(\.\.\/graph\.json\)/g, '](Graph)')
    .replace(/\]\(graph\.json\)/g, '](Graph)')
    .replace(/\]\(([a-z0-9-]+)\.md\)/g, (full, stem) => {
      const file = `${stem}.md`
      if (!existsSync(join(KNOWLEDGE, 'areas', file))) {
        return full
      }
      return `](${wikiPageStem(file)})`
    })
}

function withWikiBanner(body, sourceRel) {
  const url = sourceBlobUrl(sourceRel)
  const source = url ? `[\`${sourceRel}\`](${url})` : `\`${sourceRel}\``
  const banner = `> Mirrored from ${source}. Edit the repo file, then run \`npm run knowledge:wiki\`.\n\n`
  const prepared = rewriteLinksForWiki(body)
  if (prepared.startsWith('> Mirrored from')) {
    return prepared.replace(/^> Mirrored from[\s\S]*?\n\n/, banner)
  }
  return banner + prepared
}

function writePage(wikiDir, pageName, sourceAbs, sourceRel) {
  const body = readFileSync(sourceAbs, 'utf8')
  writeFileSync(join(wikiDir, pageName), withWikiBanner(body, sourceRel))
}

function writeGraphPage(wikiDir) {
  const sourceRel = 'docs/knowledge/graph.json'
  const json = readFileSync(join(KNOWLEDGE, 'graph.json'), 'utf8')
  const body = `# Knowledge graph (machine)\n\n\`\`\`json\n${json}\n\`\`\`\n`
  writeFileSync(join(wikiDir, 'Graph.md'), withWikiBanner(body, sourceRel))
}

function writeSidebar(wikiDir, areaFiles) {
  const lines = [
    '**Anystring knowledge**',
    '',
    '* [Catalog (Home)](Home)',
    '* [Agent protocol](Agent-Protocol)',
    '* [Agent index](Agent-Index)',
    '* [Graph](Graph)',
    '',
    '**Areas**',
    '',
  ]
  for (const file of [...areaFiles].sort()) {
    const stem = wikiPageStem(file)
    lines.push(`* [${stem.replace(/-/g, ' ')}](${stem})`)
  }
  lines.push('')
  writeFileSync(join(wikiDir, '_Sidebar.md'), `${lines.join('\n')}\n`)
}

function managedPages(areaFiles) {
  const pages = new Set([
    'Home.md',
    'Agent-Index.md',
    'Agent-Protocol.md',
    'Graph.md',
    '_Sidebar.md',
  ])
  for (const file of areaFiles) {
    pages.add(titleFromAreaFile(file))
  }
  return pages
}

function removeStalePages(wikiDir, managed) {
  for (const name of readdirSync(wikiDir)) {
    if (!name.endsWith('.md')) continue
    if (KEEP_WIKI_FILES.has(name)) continue
    if (managed.has(name)) continue
    unlinkSync(join(wikiDir, name))
    console.log(`Removed stale wiki page: ${name}`)
  }
}

function syncMarkdown(wikiDir) {
  const areaFiles = readdirSync(join(KNOWLEDGE, 'areas')).filter((f) => f.endsWith('.md'))

  writePage(
    wikiDir,
    'Home.md',
    join(KNOWLEDGE, 'CATALOG.md'),
    'docs/knowledge/CATALOG.md',
  )
  writePage(
    wikiDir,
    'Agent-Index.md',
    join(KNOWLEDGE, 'INDEX.md'),
    'docs/knowledge/INDEX.md',
  )
  writePage(
    wikiDir,
    'Agent-Protocol.md',
    join(KNOWLEDGE, 'AGENT_PROTOCOL.md'),
    'docs/knowledge/AGENT_PROTOCOL.md',
  )
  writeGraphPage(wikiDir)

  for (const file of areaFiles) {
    writePage(
      wikiDir,
      titleFromAreaFile(file),
      join(KNOWLEDGE, 'areas', file),
      `docs/knowledge/areas/${file}`,
    )
  }

  writeSidebar(wikiDir, areaFiles)
  removeStalePages(wikiDir, managedPages(areaFiles))
}

function ensureKnowledgePresent() {
  for (const rel of ['CATALOG.md', 'INDEX.md', 'graph.json', 'areas']) {
    if (!existsSync(join(KNOWLEDGE, rel))) {
      throw new Error(`Missing ${rel} under docs/knowledge — aborting wiki sync`)
    }
  }
}

function cloneWiki() {
  const dir = mkdtempSync(join(tmpdir(), 'anystring-wiki-'))
  run('git', ['clone', '--depth', '1', wikiRemoteUrl(), dir], ROOT)
  return dir
}

function commitAndPush(wikiDir) {
  run('git', ['add', '-A'], wikiDir)
  const dirty = runCapture('git', ['status', '--porcelain'], wikiDir)
  if (!dirty) {
    console.log('Wiki already up to date.')
    return
  }
  run(
    'git',
    [
      '-c',
      'user.name=anystring-knowledge-bot',
      '-c',
      'user.email=bot@local',
      'commit',
      '-m',
      'Sync knowledge catalog from main repo',
    ],
    wikiDir,
  )
  run('git', ['push', 'origin', 'HEAD'], wikiDir)
  console.log('Wiki synced: https://github.com/BadKirill/anystring/wiki')
}

function main() {
  ensureKnowledgePresent()
  // Prefer origin/HEAD for banner branch detection
  try {
    runCapture('git', ['rev-parse', '--abbrev-ref', 'origin/HEAD'])
  } catch {
    run('git', ['remote', 'set-head', 'origin', '-a'], ROOT)
  }
  const wikiDir = cloneWiki()
  try {
    syncMarkdown(wikiDir)
    commitAndPush(wikiDir)
  } finally {
    rmSync(wikiDir, { recursive: true, force: true })
  }
}

main()
