/**
 * HTML sanitizer para el preview y el guardado del Asistente de HTML con IA.
 *
 * Es un ESPEJO EXACTO del sanitizer del storefront
 * (mitienda-storefront-nuxt3/app/utils/sanitize-html.ts), de modo que el preview
 * del backoffice refleje fielmente lo que el storefront renderizará. Si cambias
 * uno, cambia el otro.
 *
 * Trabaja sobre un árbol, no sobre el texto: `htmlparser2` tokeniza el HTML, se
 * quitan las etiquetas y atributos peligrosos, y lo que queda se vuelve a
 * serializar escapando siempre texto y valores de atributo. El porqué de cada
 * regla está en el archivo del storefront.
 */
import { parseDocument } from 'htmlparser2'

/** Forma mínima de los nodos de domhandler que recorremos. */
interface DomNode {
  type: string
  name?: string
  data?: string
  attribs?: Record<string, string>
  children?: DomNode[]
}

/** Se eliminan junto con todo lo que contienen. */
const DROP_WITH_CONTENT = new Set([
  'script', 'object', 'embed', 'applet', 'noscript', 'noembed', 'noframes',
  'xmp', 'plaintext', 'listing', 'template', 'frame', 'frameset', 'portal',
])

/** Se elimina la etiqueta; si tuviera contenido, se conserva. */
const UNWRAP = new Set(['base', 'meta', 'link', 'form'])

const VOID_TAGS = new Set([
  'area', 'br', 'col', 'hr', 'img', 'input', 'source', 'track', 'wbr',
])

const URL_ATTRS = new Set([
  'href', 'src', 'action', 'xlink:href', 'poster', 'background', 'data', 'cite', 'ping',
])

/** Etiquetas donde un `data:image/…` es una imagen incrustada legítima. */
const DATA_IMAGE_TAGS = new Set(['img', 'source', 'image'])

const SVG_ANIMATION_TAGS = new Set(['set', 'animate', 'animatetransform', 'animatemotion'])

const VALID_TAG_NAME = /^[a-z][a-z0-9:-]*$/
const VALID_ATTR_NAME = /^[a-zA-Z_:][-a-zA-Z0-9_:.]*$/

/** Hosts allowed to be embedded via <iframe>. Exact hostname match only. */
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
    // Cloudflare Stream customer subdomains: *.cloudflarestream.com
    return host.endsWith('.cloudflarestream.com')
  } catch {
    return false
  }
}

/** Dangerous CSS constructs removed from inside <style> blocks. */
const CSS_AT_IMPORT = /@import\b[^;]*;?/gi
const CSS_EXPRESSION = /expression\s*\(/gi
const CSS_BEHAVIOR = /(?:-moz-binding|behavior)\s*:[^;}]*/gi
const CSS_BAD_URL = /url\(\s*(['"]?)\s*(?:javascript|data|vbscript)\s*:[^)]*\1\s*\)/gi
// Dentro de un <svg> el navegador lee el contenido de <style> como marcado, no
// como texto: un `<img onerror>` ahí adentro cobraría vida. Sin un `<` que abra
// etiqueta no hay nada que cobrar vida (`@media (width < 600px)` no se toca).
const CSS_TAG_OPENER = /<(?=[a-zA-Z/!?])/g

function sanitizeStyleCss(css: string): string {
  return css
    .replace(CSS_AT_IMPORT, '')
    .replace(CSS_EXPRESSION, '(')
    .replace(CSS_BEHAVIOR, '')
    .replace(CSS_BAD_URL, 'url()')
    .replace(CSS_TAG_OPENER, '')
}

function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeAttr(value: string): string {
  return escapeText(value).replace(/"/g, '&quot;')
}

function isDangerousUrl(tag: string, value: string): boolean {
  // El navegador ignora espacios y caracteres de control dentro del esquema:
  // `java\tscript:` es `javascript:`.
  // eslint-disable-next-line no-control-regex
  const compact = value.replace(/[\u0000- \u007f-\u009f ]/g, '').toLowerCase()
  if (/^(javascript|vbscript|livescript):/.test(compact)) return true
  if (compact.startsWith('data:')) {
    return !(DATA_IMAGE_TAGS.has(tag) && compact.startsWith('data:image/'))
  }
  return false
}

function serializeAttrs(tag: string, attribs: Record<string, string>): string {
  let out = ''
  for (const [rawName, value] of Object.entries(attribs)) {
    const name = rawName.toLowerCase()
    if (!VALID_ATTR_NAME.test(name)) continue
    if (name.startsWith('on') || name === 'srcdoc' || name === 'formaction') continue
    if (URL_ATTRS.has(name) && isDangerousUrl(tag, value)) continue
    out += ` ${name}="${escapeAttr(value)}"`
  }
  return out
}

function textContent(nodes: DomNode[]): string {
  return nodes.map(n => (n.type === 'text' ? n.data ?? '' : textContent(n.children ?? []))).join('')
}

function serialize(nodes: DomNode[]): string {
  let out = ''
  for (const node of nodes) {
    if (node.type === 'text') {
      out += escapeText(node.data ?? '')
      continue
    }
    // Comentarios, doctype y CDATA no se emiten.
    if (node.type !== 'tag' && node.type !== 'script' && node.type !== 'style') continue

    const tag = (node.name ?? '').toLowerCase()
    const attribs = node.attribs ?? {}
    const children = node.children ?? []

    if (DROP_WITH_CONTENT.has(tag)) continue
    if (UNWRAP.has(tag) || !VALID_TAG_NAME.test(tag)) {
      out += serialize(children)
      continue
    }
    if (tag === 'style') {
      out += `<style>${sanitizeStyleCss(textContent(children))}</style>`
      continue
    }
    if (tag === 'iframe') {
      if (isAllowedVideoSrc(attribs.src)) out += `<iframe${serializeAttrs(tag, attribs)}></iframe>`
      continue
    }
    // Animación SVG que le escribe un href a su elemento padre.
    if (SVG_ANIMATION_TAGS.has(tag) && /href/i.test(attribs.attributename ?? attribs.attributeName ?? '')) continue

    out += `<${tag}${serializeAttrs(tag, attribs)}>`
    if (VOID_TAGS.has(tag)) continue
    out += `${serialize(children)}</${tag}>`
  }
  return out
}

export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return ''

  // recognizeSelfClosing: sin esto un `<path … />` de un SVG se traga a sus
  // hermanos como hijos y el dibujo no se pinta.
  const doc = parseDocument(html, { decodeEntities: true, recognizeSelfClosing: true })
  return serialize(doc.children as unknown as DomNode[])
}
