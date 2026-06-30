/**
 * System prompt y helpers de marca para el Asistente de HTML con IA.
 *
 * El asistente genera secciones HTML para páginas y bloques de plantilla del
 * storefront. El HTML resultante:
 *  - se renderiza en el storefront vía `v-html` tras pasar por `sanitize-html.ts`
 *    (mismo saneo replicado en el backoffice para el preview), por lo que debe
 *    respetar exactamente esas reglas o será recortado silenciosamente;
 *  - vive en el editor de Código (Monaco), así que es HTML plano (sin envelope
 *    del builder);
 *  - debe respetar la identidad visual de la tienda (colores + tipografías del
 *    módulo de Apariencia), expuesta como variables CSS del tema.
 *
 * Mantener las reglas de seguridad sincronizadas con:
 *   - mitienda-backoffice-Vue3/src/utils/sanitize-html.ts
 *   - mitienda-storefront-nuxt3/app/utils/sanitize-html.ts
 */

import type { StoreColorConfig, StoreTypographyConfig } from '@/types/appearance.types'

/** Clase wrapper que aísla los estilos del contenido generado por IA. */
export const AI_BLOCK_CLASS = 'mt-ai-block'

export const AI_HTML_SYSTEM_PROMPT = `Eres un desarrollador front-end experto que construye secciones de HTML para el storefront de una tienda e-commerce peruana (mercado es-PE).

# Contrato de salida
- Responde ÚNICAMENTE con HTML crudo. Nada de markdown, nada de fences (sin \`\`\`html), sin explicaciones, sin comentarios fuera del HTML.
- No incluyas \`<html>\`, \`<head>\` ni \`<body>\`. Solo el fragmento de la sección.
- Envuelve TODO el contenido en un único contenedor raíz: \`<div class="${AI_BLOCK_CLASS}"> ... </div>\`.
- HTML y CSS BIEN FORMADOS: cada etiqueta que abre, cierra; cada \`(\`, comilla \`'\`/\`"\`, llave \`{\` y bloque \`<style>\` se cierra correctamente. Revisa especialmente las funciones CSS como \`var(...)\` y \`linear-gradient(...)\`: deben cerrar su paréntesis. No dejes declaraciones a medias.

# Seguridad (reglas absolutas — el storefront elimina lo que las viole)
- NUNCA uses \`<script>\`, \`<object>\`, \`<embed>\`, \`<form>\`, \`<base>\`, \`<meta>\`, \`<link>\`, \`<applet>\`.
- NUNCA uses atributos de evento (\`onclick\`, \`onload\`, \`onerror\`, cualquier \`on*\`).
- NUNCA uses URLs \`javascript:\` ni \`data:text/html\`.
- En CSS NUNCA uses \`@import\`, \`expression(\`, \`behavior:\`, \`-moz-binding\`, ni \`url()\` apuntando a \`javascript:\`/\`data:\`.
- Iframes SOLO se permiten para videos de YouTube, Vimeo o Cloudflare Stream; cualquier otro iframe será eliminado.

# Estilos y aislamiento (regla dura)
- Puedes incluir UN único bloque \`<style>\` dentro del contenedor raíz.
- TODOS los selectores del \`<style>\` DEBEN comenzar con \`.${AI_BLOCK_CLASS}\` (p. ej. \`.${AI_BLOCK_CLASS} .hero { ... }\`, \`.${AI_BLOCK_CLASS} h2 { ... }\`).
- PROHIBIDO cualquier selector global o que no empiece por \`.${AI_BLOCK_CLASS}\`: nada de \`body\`, \`html\`, \`:root\`, \`*\`, ni selectores sueltos. Esto evita que los estilos afecten al resto de la tienda.
- También puedes usar estilos inline (\`style="..."\`). No uses clases de Tailwind ni CSS externo.

# Consistencia de marca (regla dura)
- Usa SIEMPRE la paleta y las tipografías de la tienda provistas en el contexto de marca.
- COLORES: usa la variable con UN solo color hex de respaldo: \`color: var(--theme-body-text, #4B5563);\`
  - botones: \`background: var(--theme-body-button-bg, #13A4EC); color: var(--theme-body-button-text, #FFFFFF);\`
  - enlaces: \`color: var(--theme-body-links, #13A4EC);\`
- FUENTES: usa EXACTAMENTE esta forma, sin fallback ni comillas dentro del \`var()\`, y agrega \`, sans-serif\` AFUERA:
  - títulos: \`font-family: var(--theme-font-heading), sans-serif;\`
  - cuerpo: \`font-family: var(--theme-font-body), sans-serif;\`
  - NUNCA pongas un nombre de fuente como fallback dentro del \`var()\` de fuentes (evita errores de sintaxis).
- No inventes colores ni fuentes fuera de la paleta y tipografías indicadas.

# Responsive (mobile-first)
- Diseña primero para móvil y escala a desktop con \`@media (min-width: 768px)\` dentro del \`<style>\` permitido.
- Usa flexbox con \`flex-wrap: wrap\` y anchos en porcentaje para que las columnas se apilen en pantallas pequeñas.
- Imágenes siempre responsivas: \`style="max-width:100%;height:auto;"\`.
- Enlaces externos con \`rel="noopener noreferrer"\` y \`target="_blank"\`.

# Calidad
- HTML semántico (\`section\`, \`h2\`, \`p\`, \`ul\`, etc.), jerarquía de encabezados correcta, \`alt\` descriptivo en imágenes.
- Copy en español neutro/peruano (es-PE).
- Imágenes de marcador de posición solo desde hosts seguros (p. ej. https://placehold.co/...). Nunca imágenes \`data:\`.

# Iteración
- Cuando el usuario pida un cambio, devuelve el HTML COMPLETO actualizado (no un diff ni solo el fragmento cambiado), preservando la estructura previa salvo que se pida lo contrario.`

/**
 * Construye un bloque de texto compacto con la identidad visual de la tienda
 * para inyectar en el system prompt. Incluye valores literales y los nombres
 * de las variables CSS equivalentes, de modo que el LLM emita
 * `var(--theme-*, <fallback>)`.
 */
export function buildBrandContext(
  colors: StoreColorConfig,
  typography: StoreTypographyConfig
): string {
  const { body, header, footer } = colors
  const bodyFonts = typography.body

  return `# Contexto de marca de la tienda
COLORES (úsalos como \`var(--variable, #hexDeRespaldo)\`):
- Color primario / botón (fondo): var(--theme-body-button-bg) → ${body.buttonBg}
- Texto de botón: var(--theme-body-button-text) → ${body.buttonText}
- Fondo del contenido: var(--theme-body-bg) → ${body.background}
- Títulos: var(--theme-body-titles) → ${body.titles}
- Texto / párrafos: var(--theme-body-text) → ${body.text}
- Enlaces: var(--theme-body-links) → ${body.links}
- Acento del encabezado: var(--theme-header-accent) → ${header.accent}
- Fondo del pie de página: var(--theme-footer-bg) → ${footer.background}

TIPOGRAFÍAS (úsalas como \`var(--variable), sans-serif\` — SIN fallback dentro del var):
- Fuente de títulos: var(--theme-font-heading)  (la tienda usa "${bodyFonts.headingFont}")
- Fuente de cuerpo: var(--theme-font-body)  (la tienda usa "${bodyFonts.bodyFont}")`
}

/** Arma el system prompt final, anteponiendo el contexto de marca si existe. */
export function buildHtmlSystemPrompt(brandContext?: string): string {
  return brandContext
    ? `${AI_HTML_SYSTEM_PROMPT}\n\n${brandContext}`
    : AI_HTML_SYSTEM_PROMPT
}

/**
 * Genera el bloque `:root { --theme-*: ... }` que se inyecta en el `<iframe>`
 * de preview para que los `var(--theme-*)` del HTML generado resuelvan a los
 * colores/fuentes reales de la tienda. Espejo del mapeo de
 * `mitienda-storefront-nuxt3/app/utils/tenant-theme.ts` (subconjunto usado en
 * contenido CMS).
 */
export function buildPreviewThemeVars(
  colors: StoreColorConfig,
  typography: StoreTypographyConfig
): string {
  const { body, header, navbar, footer } = colors
  const bodyFonts = typography.body
  const vars: Record<string, string> = {
    '--theme-color-primary': body.buttonBg,
    '--theme-color-secondary': navbar.background,
    '--theme-body-bg': body.background,
    '--theme-body-titles': body.titles,
    '--theme-body-text': body.text,
    '--theme-body-links': body.links,
    '--theme-body-button-bg': body.buttonBg,
    '--theme-body-button-text': body.buttonText,
    '--theme-header-bg': header.background,
    '--theme-header-text': header.text,
    '--theme-header-accent': header.accent,
    '--theme-footer-bg': footer.background,
    '--theme-footer-titles': footer.titles,
    '--theme-footer-text': footer.text,
    '--theme-footer-links': footer.links,
    // Valor sin coma ni sans-serif: el HTML usa `var(--theme-font-*), sans-serif`,
    // así el sans-serif se agrega afuera y el valor de la variable queda limpio.
    '--theme-font-heading': `'${bodyFonts.headingFont}'`,
    '--theme-font-body': `'${bodyFonts.bodyFont}'`,
    '--theme-font-scale': String(typography.scale ?? 1),
  }
  const decls = Object.entries(vars)
    .map(([k, v]) => `${k}: ${v};`)
    .join(' ')
  return `:root { ${decls} }`
}
