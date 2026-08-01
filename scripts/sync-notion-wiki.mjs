#!/usr/bin/env node
/**
 * Explicit Notion Wiki mirror (manual / workflow_dispatch only).
 * Ordinary indexing must NOT call this — local docs/knowledge/ is the base.
 * After running: read-back the Notion parent page and confirm to the user.
 *
 * Requires:
 *   NOTION_API_KEY   — integration token with access to the parent page
 *   NOTION_PARENT_ID — default: official Anytune Wiki page id
 *
 * Never commit the token.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const KNOWLEDGE = join(ROOT, 'docs', 'knowledge')
const NOTION_VERSION = process.env.NOTION_VERSION ?? '2022-06-28'
const DEFAULT_PARENT = '3a57e1830c32800c8d3be98bdb534bc4'

const TOKEN = process.env.NOTION_API_KEY ?? process.env.NOTION_TOKEN
const PARENT = (process.env.NOTION_PARENT_ID ?? DEFAULT_PARENT).replace(/-/g, '')

const ORDER = [
  ['CATALOG.md', 'Catalog (Home)', null],
  ['AGENT_PROTOCOL.md', 'Agent protocol (all tools)', null],
  ['INDEX.md', 'Selective reading index', null],
  ['graph.json', 'Knowledge graph (machine)', true],
  ['areas/architecture.md', 'Architecture and data flow', null],
  ['areas/audio.md', 'Audio pipeline and pitch detection', null],
  ['areas/native-shell.md', 'Native shell (iOS / Android)', null],
  ['areas/core-music.md', 'Core music theory', null],
  ['areas/core-signal.md', 'Core signal and stabilizer', null],
  ['areas/core-tunings.md', 'Core tunings and analyzer', null],
  ['areas/components.md', 'Components and UI', null],
  ['areas/state.md', 'Tuner screen state', null],
  ['areas/storage.md', 'Storage and persistence', null],
  ['areas/testing.md', 'Testing (Vitest / Playwright)', null],
  ['areas/ci-cd.md', 'CI/CD and deploy', null],
  ['areas/tooling.md', 'Tooling and npm scripts', null],
  ['areas/patterns-and-rules.md', 'Patterns and hard rules', null],
  ['areas/file-index.md', 'File catalog', null],
]

function uuid(raw) {
  const h = raw.replace(/-/g, '')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

async function api(method, path, body) {
  const res = await fetch(`https://api.notion.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    data = { raw: text }
  }
  if (!res.ok) {
    throw new Error(`${res.status} ${path}: ${JSON.stringify(data).slice(0, 500)}`)
  }
  return data
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function rt(text) {
  const content = text.slice(0, 2000)
  return content ? [{ type: 'text', text: { content } }] : []
}

function mdToBlocks(md) {
  const blocks = []
  const lines = md.split('\n')
  let i = 0
  let inCode = false
  let codeLang = 'plain text'
  let codeBuf = []

  const flushCode = () => {
    const content = codeBuf.join('\n').slice(0, 2000)
    if (content) {
      const allowed = new Set([
        'javascript',
        'typescript',
        'python',
        'bash',
        'json',
        'markdown',
        'plain text',
        'yaml',
        'html',
        'css',
      ])
      blocks.push({
        object: 'block',
        type: 'code',
        code: {
          language: allowed.has(codeLang) ? codeLang : 'plain text',
          rich_text: rt(content),
        },
      })
    }
    codeBuf = []
    codeLang = 'plain text'
  }

  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith('```')) {
      if (inCode) {
        flushCode()
        inCode = false
      } else {
        inCode = true
        codeLang = (line.slice(3).trim() || 'plain text').toLowerCase()
      }
      i += 1
      continue
    }
    if (inCode) {
      codeBuf.push(line)
      i += 1
      continue
    }
    if (!line.trim()) {
      i += 1
      continue
    }
    if (line.startsWith('# ')) {
      i += 1
      continue
    }
    if (line.startsWith('## ')) {
      blocks.push({
        object: 'block',
        type: 'heading_2',
        heading_2: { rich_text: rt(line.slice(3).trim()) },
      })
    } else if (line.startsWith('### ')) {
      blocks.push({
        object: 'block',
        type: 'heading_3',
        heading_3: { rich_text: rt(line.slice(4).trim()) },
      })
    } else if (line.startsWith('|')) {
      const table = [line]
      i += 1
      while (i < lines.length && lines[i].startsWith('|')) {
        table.push(lines[i])
        i += 1
      }
      blocks.push({
        object: 'block',
        type: 'code',
        code: { language: 'plain text', rich_text: rt(table.join('\n').slice(0, 2000)) },
      })
      continue
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      blocks.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: { rich_text: rt(line.slice(2).trim()) },
      })
    } else if (line.startsWith('> ')) {
      blocks.push({
        object: 'block',
        type: 'quote',
        quote: { rich_text: rt(line.slice(2).trim()) },
      })
    } else {
      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: { rich_text: rt(line.trim()) },
      })
    }
    i += 1
  }
  if (inCode) flushCode()
  return blocks
}

async function clearChildren(blockId) {
  let cursor
  for (;;) {
    let path = `/blocks/${blockId}/children?page_size=100`
    if (cursor) path += `&start_cursor=${cursor}`
    const data = await api('GET', path)
    for (const block of data.results ?? []) {
      try {
        if (block.type === 'child_page') {
          await api('PATCH', `/pages/${block.id}`, { archived: true })
        } else {
          await api('DELETE', `/blocks/${block.id}`)
        }
        await sleep(200)
      } catch (error) {
        console.warn('clear warn:', String(error).slice(0, 160))
      }
    }
    if (!data.has_more) break
    cursor = data.next_cursor
  }
}

async function appendBlocks(pageId, blocks) {
  for (let start = 0; start < blocks.length; start += 90) {
    const batch = blocks.slice(start, start + 90)
    if (batch.length === 0) continue
    await api('PATCH', `/blocks/${pageId}/children`, { children: batch })
    await sleep(350)
  }
}

async function createPage(title, markdown) {
  const blocks = mdToBlocks(markdown)
  const first = blocks.slice(0, 90)
  const rest = blocks.slice(90)
  const page = await api('POST', '/pages', {
    parent: { page_id: uuid(PARENT) },
    icon: { type: 'emoji', emoji: '📚' },
    properties: {
      title: [{ type: 'text', text: { content: title.slice(0, 2000) } }],
    },
    children: first,
  })
  if (rest.length > 0) await appendBlocks(page.id, rest)
  return page
}

function loadEntries() {
  const entries = []
  for (const [rel, label, isJson] of ORDER) {
    const abs = join(KNOWLEDGE, rel)
    if (!existsSync(abs)) {
      // native-shell may be missing on older trees — skip quietly
      console.warn(`skip missing ${rel}`)
      continue
    }
    let markdown
    if (isJson) {
      const json = readFileSync(abs, 'utf8')
      markdown = `# Knowledge graph (machine)\n\n\`\`\`json\n${json}\n\`\`\`\n`
    } else {
      markdown = readFileSync(abs, 'utf8')
    }
    entries.push({ label, markdown })
  }
  // Include any extra area pages not in ORDER
  const areasDir = join(KNOWLEDGE, 'areas')
  const known = new Set(ORDER.map(([rel]) => rel))
  for (const file of readdirSync(areasDir)
    .filter((f) => f.endsWith('.md'))
    .sort()) {
    const rel = `areas/${file}`
    if (known.has(rel)) continue
    const label = file
      .replace(/\.md$/, '')
      .split('-')
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ')
    entries.push({ label, markdown: readFileSync(join(areasDir, file), 'utf8') })
  }
  return entries
}

async function main() {
  if (!TOKEN) {
    throw new Error('NOTION_API_KEY is required (do not commit the token)')
  }
  if (!existsSync(KNOWLEDGE)) {
    throw new Error('docs/knowledge missing')
  }
  const entries = loadEntries()
  console.log(`Notion parent ${uuid(PARENT)} — ${entries.length} pages`)
  await clearChildren(uuid(PARENT))
  await api('PATCH', `/pages/${uuid(PARENT)}`, {
    icon: { type: 'emoji', emoji: '📚' },
    archived: false,
    properties: {
      title: [{ type: 'text', text: { content: 'Anytune Wiki' } }],
    },
  })
  for (const entry of entries) {
    console.log(`  creating: ${entry.label}`)
    await createPage(entry.label, entry.markdown)
    await sleep(350)
  }
  const parent = await api('GET', `/pages/${uuid(PARENT)}`)
  console.log('DONE', parent.url)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
