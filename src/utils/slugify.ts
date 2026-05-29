/**
 * Convert an arbitrary string into an ASCII-safe URL slug.
 *
 * Mirrors the backend's ascii_slug() helper (general_helper.php). Non-ASCII
 * slugs break the storefront product detail page: CodeIgniter rejects URLs
 * whose decoded path contains characters outside its permittedURICharacters
 * set (a-z 0-9 ~ % . : _ -), returning HTTP 400 before the controller runs.
 * Keep this in sync with the backend so the preview matches what gets saved.
 */
export function slugify(text: string): string {
  if (!text) return ''

  return text
    .normalize('NFD') // split accented letters into base + combining mark
    .replace(/[̀-ͯ]/g, '') // strip the combining marks (á → a)
    .replace(/ñ/gi, 'n')
    .replace(/ç/gi, 'c')
    .replace(/ß/g, 'ss')
    .replace(/æ/gi, 'ae')
    .replace(/œ/gi, 'oe')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // collapse anything else into single hyphens
    .replace(/^-+|-+$/g, '') // trim leading/trailing hyphens
}
