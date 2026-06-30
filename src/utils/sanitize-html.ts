/**
 * HTML sanitizer para el preview y el guardado del Asistente de HTML con IA.
 *
 * Es un ESPEJO EXACTO del sanitizer del storefront
 * (mitienda-storefront-nuxt3/app/utils/sanitize-html.ts), de modo que el preview
 * del backoffice refleje fielmente lo que el storefront renderizará. Si cambias
 * uno, cambia el otro.
 *
 * - Elimina tags peligrosos (script, object, embed, form, etc.) y atributos de
 *   evento (onclick, onerror, ...).
 * - Iframes solo si su `src` apunta a un host de video confiable (YouTube,
 *   Vimeo, Cloudflare Stream).
 * - Permite bloques <style> pero sanea su CSS (@import, expression(), behavior,
 *   -moz-binding, url(javascript:/data:)). El scoping (.mt-ai-block) se exige
 *   vía el system prompt, no aquí.
 */

const DANGEROUS_TAGS = /(<\s*\/?\s*(script|object|embed|form|base|meta|link|applet|svg\s+[^>]*onload)[^>]*>)/gi

const EVENT_ATTRS = /\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi

const JAVASCRIPT_URLS = /\s+(href|src|action)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi

const DATA_URLS = /\s+(href|src)\s*=\s*(?:"data:text\/html[^"]*"|'data:text\/html[^']*')/gi

const IFRAME_TAG = /<iframe\b[^>]*>(?:\s*<\/iframe>)?/gi

const SRC_ATTR = /\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i

/** Hosts permitidos para embeber vía <iframe>. Coincidencia exacta de hostname. */
const ALLOWED_VIDEO_HOSTS = new Set([
  'www.youtube.com',
  'youtube.com',
  'www.youtube-nocookie.com',
  'youtube-nocookie.com',
  'player.vimeo.com',
  'iframe.cloudflarestream.com',
])

function isAllowedVideoSrc(src: string | undefined): boolean {
  if (!src) return false
  try {
    const url = new URL(src, 'https://invalid.local')
    if (url.protocol !== 'https:') return false
    const host = url.hostname.toLowerCase()
    if (ALLOWED_VIDEO_HOSTS.has(host)) return true
    // Subdominios de clientes de Cloudflare Stream: *.cloudflarestream.com
    return host.endsWith('.cloudflarestream.com')
  } catch {
    return false
  }
}

function sanitizeIframes(html: string): string {
  return html.replace(IFRAME_TAG, (tag) => {
    const match = SRC_ATTR.exec(tag)
    const src = match ? (match[1] ?? match[2] ?? match[3]) : undefined
    return isAllowedVideoSrc(src) ? tag : ''
  })
}

const STYLE_BLOCK = /<style\b[^>]*>([\s\S]*?)<\/style>/gi

const CSS_AT_IMPORT = /@import\b[^;]*;?/gi
const CSS_EXPRESSION = /expression\s*\(/gi
const CSS_BEHAVIOR = /(?:-moz-binding|behavior)\s*:[^;}]*/gi
const CSS_BAD_URL = /url\(\s*(['"]?)\s*(?:javascript|data|vbscript)\s*:[^)]*\1\s*\)/gi

function sanitizeStyleCss(css: string): string {
  return css
    .replace(CSS_AT_IMPORT, '')
    .replace(CSS_EXPRESSION, '(')
    .replace(CSS_BEHAVIOR, '')
    .replace(CSS_BAD_URL, 'url()')
}

function sanitizeStyleBlocks(html: string): string {
  return html.replace(STYLE_BLOCK, (_full, css: string) => `<style>${sanitizeStyleCss(css)}</style>`)
}

export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return ''

  return sanitizeStyleBlocks(
    sanitizeIframes(
      html
        .replace(DANGEROUS_TAGS, '')
        .replace(EVENT_ATTRS, '')
        .replace(JAVASCRIPT_URLS, '')
        .replace(DATA_URLS, ''),
    ),
  )
}
