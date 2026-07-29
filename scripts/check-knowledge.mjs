#!/usr/bin/env node
/**
 * Validates the repo-local knowledge graph stays consistent with the codebase.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const KNOWLEDGE = join(ROOT, 'docs', 'knowledge')
const errors = []

function fail(msg) {
  errors.push(msg)
}

function read(rel) {
  return readFileSync(join(ROOT, rel), 'utf8')
}

function walkFiles(dir, pred) {
  const out = []
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name)
    const st = statSync(abs)
    if (st.isDirectory()) {
      out.push(...walkFiles(abs, pred))
    } else if (pred(abs)) {
      out.push(abs)
    }
  }
  return out
}

function checkRelativeLinks() {
  const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g
  for (const abs of walkFiles(KNOWLEDGE, (p) => p.endsWith('.md'))) {
    const text = readFileSync(abs, 'utf8')
    const rel = relative(ROOT, abs)
    for (const match of text.matchAll(linkRe)) {
      const href = match[2]
      if (/^(https?:|mailto:|#)/.test(href)) continue
      const target = href.split('#')[0]
      if (!target) continue
      const resolved = join(dirname(abs), target)
      if (!existsSync(resolved)) {
        fail(`${rel}: broken link → ${href}`)
      }
    }
  }
}

function checkGraph() {
  const graph = JSON.parse(read('docs/knowledge/graph.json'))
  const ids = new Set()
  const areaFiles = new Set(
    readdirSync(join(KNOWLEDGE, 'areas')).filter((f) => f.endsWith('.md')),
  )
  const graphAreas = new Set()

  for (const node of graph.nodes ?? []) {
    ids.add(node.id)
    if (!existsSync(join(ROOT, node.path))) {
      fail(`graph.json: missing node path ${node.path}`)
    }
    if (node.path.startsWith('docs/knowledge/areas/')) {
      graphAreas.add(node.path.split('/').pop())
    }
  }
  for (const edge of graph.edges ?? []) {
    if (!ids.has(edge.from) || !ids.has(edge.to)) {
      fail(`graph.json: bad edge ${edge.from} → ${edge.to}`)
    }
  }
  for (const file of areaFiles) {
    if (!graphAreas.has(file)) fail(`graph.json: area not listed: ${file}`)
  }
  for (const file of graphAreas) {
    if (!areaFiles.has(file)) fail(`graph.json: listed area missing on disk: ${file}`)
  }
}

function checkIndexRoutes() {
  const index = read('docs/knowledge/INDEX.md')
  const linked = [...index.matchAll(/areas\/([a-z0-9-]+\.md)/g)].map((m) => m[1])
  const areas = readdirSync(join(KNOWLEDGE, 'areas')).filter((f) => f.endsWith('.md'))
  for (const file of areas) {
    if (!linked.includes(file)) fail(`INDEX.md: area not routed: ${file}`)
  }
  for (const file of linked) {
    if (!areas.includes(file)) fail(`INDEX.md: routes to missing area: ${file}`)
  }
}

function isSrcFileIndexed(idx, rel, name) {
  if (idx.includes(rel) || idx.includes(`\`${name}\``)) {
    return true
  }
  if (name.endsWith('.test.ts')) {
    const impl = name.replace(/\.test\.ts$/, '.ts')
    if (idx.includes(`\`${impl}\``) && idx.includes('.test.ts')) {
      return true
    }
  }
  return false
}

function checkSrcCoverage() {
  const idx = read('docs/knowledge/areas/file-index.md')
  const srcRoot = join(ROOT, 'src')
  const files = walkFiles(
    srcRoot,
    (p) => !p.includes(`${join('src', 'assets')}`) && !p.endsWith('.DS_Store'),
  )
  for (const abs of files) {
    const rel = relative(ROOT, abs)
    const name = abs.split('/').pop() ?? ''
    if (!isSrcFileIndexed(idx, rel, name)) {
      fail(`file-index.md: src file not indexed: ${rel}`)
    }
  }
}

function checkRequiredFiles() {
  for (const rel of [
    'docs/knowledge/INDEX.md',
    'docs/knowledge/CATALOG.md',
    'docs/knowledge/AGENT_PROTOCOL.md',
    'docs/knowledge/graph.json',
    'AGENTS.md',
    'CLAUDE.md',
    'llms.txt',
    '.github/copilot-instructions.md',
    '.cursor/rules/knowledge-graph.mdc',
    '.cursor/skills/knowledge-lookup/SKILL.md',
    'scripts/sync-knowledge-wiki.mjs',
    'scripts/sync-notion-wiki.mjs',
    'scripts/refresh-file-index.mjs',
  ]) {
    if (!existsSync(join(ROOT, rel))) fail(`missing required file: ${rel}`)
  }
}

function checkAutoInventoryFresh() {
  try {
    execFileSync('node', [join(ROOT, 'scripts', 'refresh-file-index.mjs'), '--check'], {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
  } catch (error) {
    const stderr =
      error && typeof error === 'object' && 'stderr' in error
        ? String(error.stderr)
        : 'auto inventory stale'
    fail(stderr.trim() || 'file-index auto inventory is stale')
  }
}

checkRequiredFiles()
checkRelativeLinks()
checkGraph()
checkIndexRoutes()
checkSrcCoverage()
checkAutoInventoryFresh()

if (errors.length > 0) {
  console.error(
    `knowledge check failed (${String(errors.length)}):\n${errors.join('\n')}`,
  )
  process.exit(1)
}
console.log('knowledge check passed')
