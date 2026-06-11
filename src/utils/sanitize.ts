import DOMPurify from 'dompurify'

// Saneamiento centralizado para todo el HTML de contenido (descripciones de
// producto, blog, páginas, docs de ayuda) que se inyecta vía `v-html`.
//
// Defense-in-depth sobre el default de DOMPurify (que ya elimina `<script>`,
// `<style>` y todos los handlers `on*`): prohibimos además tags que el
// contenido de merchant nunca necesita y que solo aportan superficie de
// ataque (phishing/UI-redress/inyección estructural). NO restringimos
// img/iframe/video/tablas ni estilos inline para no romper el contenido rico
// legítimo (embeds de video, formato del editor Quill / page-builder).
const FORBID_TAGS = [
  'form', 'input', 'button', 'textarea', 'select', 'option',
  'base', 'link', 'meta', 'object', 'embed'
]
const FORBID_ATTR = ['formaction', 'action', 'ping']

export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, { FORBID_TAGS, FORBID_ATTR })
}
