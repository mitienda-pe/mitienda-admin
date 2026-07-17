import DOMPurify from 'dompurify'

// Saneamiento centralizado para todo el HTML de contenido (descripciones de
// producto, blog, páginas, docs de ayuda) que se inyecta vía `v-html`.
//
// Defense-in-depth sobre el default de DOMPurify (que ya elimina `<script>`,
// `<style>` y todos los handlers `on*`): prohibimos además tags que el
// contenido de merchant nunca necesita y que solo aportan superficie de
// ataque (phishing/UI-redress/inyección estructural).
const FORBID_TAGS = [
  'form', 'input', 'button', 'textarea', 'select', 'option',
  'base', 'link', 'meta', 'object', 'embed'
]
const FORBID_ATTR = ['formaction', 'action', 'ping']

// DOMPurify elimina `<iframe>` por defecto. Los re-habilitamos SOLO para embeds
// de video de hosts confiables (YouTube/Vimeo/Cloudflare Stream), para que los
// videos del editor Quill / page-builder se vean en los previews del backoffice.
// El allowlist se aplica en un hook (abajo) con match exacto de hostname; debe
// mantenerse en sync con el sanitizer del storefront (app/utils/sanitize-html.ts)
// y con `frame-src` de la CSP (public/_headers).
const ADD_TAGS = ['iframe']
const ADD_ATTR = ['allowfullscreen', 'frameborder', 'allow']

const ALLOWED_VIDEO_HOSTS = new Set([
  'www.youtube.com',
  'youtube.com',
  'www.youtube-nocookie.com',
  'youtube-nocookie.com',
  'player.vimeo.com',
  'iframe.cloudflarestream.com'
])

function isAllowedVideoSrc(src: string | null | undefined): boolean {
  if (!src) return false
  try {
    const url = new URL(src, 'https://invalid.local')
    if (url.protocol !== 'https:') return false
    const host = url.hostname.toLowerCase()
    return ALLOWED_VIDEO_HOSTS.has(host) || host.endsWith('.cloudflarestream.com')
  } catch {
    return false
  }
}

// Un solo hook global: descarta cualquier <iframe> cuyo src no sea de un host de
// video permitido (los demás tags ya los cubre FORBID_TAGS / el default).
DOMPurify.addHook('uponSanitizeElement', (node, data) => {
  if (data.tagName === 'iframe') {
    const el = node as unknown as Element
    if (!isAllowedVideoSrc(el.getAttribute('src'))) {
      el.parentNode?.removeChild(el)
    }
  }
})

export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, { FORBID_TAGS, FORBID_ATTR, ADD_TAGS, ADD_ATTR })
}
