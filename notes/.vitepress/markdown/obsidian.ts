function escapeHtml(s: string) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function slugify(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
}

function wikiTargetToHref(targetRaw: string) {
  const target = targetRaw.trim()
  if (!target) return ''

  const [pathPartRaw, headingRaw] = target.split('#', 2)
  const pathPart = pathPartRaw.trim().replace(/\.md$/i, '').replaceAll('\\', '/')
  const path = pathPart.startsWith('/') ? pathPart.slice(1) : pathPart
  const encoded = path
    .split('/')
    .filter(Boolean)
    .map((seg) => encodeURIComponent(seg))
    .join('/')

  const base = `/${encoded}`
  if (!headingRaw) return base

  const hash = slugify(headingRaw)
  return `${base}#${hash}`
}

export function obsidianMarkdown(md: any) {
  md.core.ruler.after('inline', 'obsidian-wikilink', (state: any) => {
    const Token = state.Token
    const WIKILINK_RE = /(!)?\[\[([^\]\|]+)(?:\|([^\]]+))?\]\]/g

    for (const token of state.tokens) {
      if (token.type !== 'inline' || !token.children) continue

      const children = token.children
      const next: any[] = []

      for (const child of children) {
        if (child.type !== 'text' || !child.content.includes('[[')) {
          next.push(child)
          continue
        }

        const text = child.content
        let lastIndex = 0
        let m: RegExpExecArray | null

        while ((m = WIKILINK_RE.exec(text))) {
          const [raw, embedFlag, target, alias] = m
          const start = m.index
          const end = start + raw.length

          if (start > lastIndex) {
            const t = new Token('text', '', 0)
            t.content = text.slice(lastIndex, start)
            next.push(t)
          }

          const href = wikiTargetToHref(target)
          if (href) {
            const labelText = (alias ?? target).trim()

            if (embedFlag && /\.(png|jpe?g|gif|webp|svg)$/i.test(target.trim())) {
              const src = href.split('#', 1)[0]
              const img = new Token('image', 'img', 0)
              img.attrs = [['src', src]]
              img.content = labelText
              next.push(img)
            } else {
              const open = new Token('link_open', 'a', 1)
              open.attrs = [['href', href]]
              const label = new Token('text', '', 0)
              label.content = labelText
              const close = new Token('link_close', 'a', -1)
              next.push(open, label, close)
            }
          } else {
            const t = new Token('text', '', 0)
            t.content = raw
            next.push(t)
          }

          lastIndex = end
        }

        if (lastIndex < text.length) {
          const t = new Token('text', '', 0)
          t.content = text.slice(lastIndex)
          next.push(t)
        }
      }

      token.children = next
    }
  })

  md.core.ruler.after('obsidian-wikilink', 'obsidian-callout', (state: any) => {
    const Token = state.Token
    const CALLOUT_RE = /^\[!([A-Za-z]+)\]([+-])?(?:\s+(.*))?$/

    for (let i = 0; i < state.tokens.length; i++) {
      const open = state.tokens[i]
      if (open.type !== 'blockquote_open') continue

      const paragraphOpen = state.tokens[i + 1]
      const inline = state.tokens[i + 2]
      const paragraphClose = state.tokens[i + 3]

      if (!paragraphOpen || !inline || !paragraphClose) continue
      if (paragraphOpen.type !== 'paragraph_open') continue
      if (inline.type !== 'inline') continue
      if (paragraphClose.type !== 'paragraph_close') continue

      const lines = String(inline.content ?? '').split('\n')
      const firstLine = (lines[0] ?? '').trim()
      const m = CALLOUT_RE.exec(firstLine)
      if (!m) continue

      const calloutType = m[1].toLowerCase()
      const title = (m[3] ?? '').trim() || calloutType.toUpperCase()

      open.tag = 'div'
      open.attrJoin('class', 'callout')
      open.attrSet('data-callout', calloutType)

      let depth = 1
      for (let j = i + 1; j < state.tokens.length; j++) {
        const t = state.tokens[j]
        if (t.type === 'blockquote_open') depth++
        if (t.type === 'blockquote_close') depth--
        if (depth === 0) {
          t.tag = 'div'
          break
        }
      }

      const header = new Token('html_block', '', 0)
      header.content = `<div class="callout-title">${escapeHtml(title)}</div>\n`
      state.tokens.splice(i + 1, 0, header)
      i++

      const rest = lines.slice(1).join('\n').trimStart()
      inline.content = rest

      if (!rest) {
        state.tokens.splice(i + 1, 3)
        i -= 1
      }
    }
  })
}
