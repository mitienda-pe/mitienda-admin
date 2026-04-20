import { marked } from 'marked'
import DOMPurify from 'dompurify'

const BLOCK_ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 'code', 'pre',
  'ul', 'ol', 'li',
  'blockquote',
  'a',
  'h3', 'h4'
]
const INLINE_ALLOWED_TAGS = ['strong', 'em', 'u', 'code', 'a', 'br']
const ALLOWED_ATTR = ['href', 'target', 'rel']

function withSafeLinks(html: string): string {
  return html.replace(/<a\s+([^>]*)>/gi, (_m, attrs) => {
    const hasTarget = /target\s*=/.test(attrs)
    const hasRel = /rel\s*=/.test(attrs)
    let out = attrs
    if (!hasTarget) out += ' target="_blank"'
    if (!hasRel) out += ' rel="noopener noreferrer"'
    return `<a ${out}>`
  })
}

export function renderBroadcastMarkdownBlock(input: string | null | undefined): string {
  if (!input) return ''
  const raw = String(marked.parse(input, { async: false, breaks: true, gfm: true }))
  const safe = String(
    DOMPurify.sanitize(raw, { ALLOWED_TAGS: BLOCK_ALLOWED_TAGS, ALLOWED_ATTR })
  )
  return withSafeLinks(safe)
}

export function renderBroadcastMarkdownInline(input: string | null | undefined): string {
  if (!input) return ''
  const raw = String(marked.parseInline(input, { async: false, breaks: false, gfm: true }))
  const safe = String(
    DOMPurify.sanitize(raw, { ALLOWED_TAGS: INLINE_ALLOWED_TAGS, ALLOWED_ATTR })
  )
  return withSafeLinks(safe)
}
