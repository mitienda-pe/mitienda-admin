// Convierte el CHANGELOG.md generado por `scripts/changelog.sh` en la lista de
// versiones que ve el comerciante.
//
// El archivo está pensado para el equipo, así que aquí se recorta lo que al
// comerciante no le sirve:
//   - el "Histórico" previo al versionado (commits en inglés, sin número);
//   - las secciones que no describen un cambio visible (Refactor, etc.);
//   - los links a los commits, que apuntan a un repo privado.

export interface ChangelogRelease {
  version: string
  date: string
  /** Markdown de las secciones visibles, sin el encabezado de la versión. */
  markdown: string
}

const VISIBLE_SECTIONS = new Set(['Novedades', 'Correcciones'])

// ` ([`abc1234`](https://github.com/.../commit/...))` al final de cada ítem.
const COMMIT_LINK = /\s*\(\[`[0-9a-f]{7,40}`\]\([^)]*\)\)/g

export function parseChangelog(md: string): ChangelogRelease[] {
  const versioned = md.split(/^# Historico/m)[0]
  const releases: ChangelogRelease[] = []

  for (const block of versioned.split(/^## /m).slice(1)) {
    const header = block.match(/^\[(v[^\]]+)\]\s*-\s*(\d{4}-\d{2}-\d{2})/)
    if (!header) continue

    const sections = block
      .split(/^### /m)
      .slice(1)
      .filter((s) => VISIBLE_SECTIONS.has(s.split('\n', 1)[0].trim()))
      .map((s) => `### ${s.replace(COMMIT_LINK, '').replace(/\s*-{3,}\s*$/, '').trim()}`)

    if (sections.length === 0) continue

    releases.push({
      version: header[1],
      date: header[2],
      markdown: sections.join('\n\n'),
    })
  }

  return releases
}
