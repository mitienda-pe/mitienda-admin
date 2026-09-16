import { describe, it, expect } from 'vitest'
import { parseChangelog } from '../changelog'

const MD = `# Changelog

Generado con \`scripts/changelog.sh\` desde los conventional commits.

## [v2.78.1] - 2026-09-16

### Correcciones

- **reparto:** avisar cuando no hay puntos ([\`df7acb6\`](https://github.com/x/y/commit/df7acb62d7ee90d21342482623459d6b8a0dd50b))

## [v2.78.0] - 2026-09-15

### Novedades

- **direcciones:** operador del punto ([\`e4734a6\`](https://github.com/x/y/commit/e4734a6))

### Refactor

- mover helpers ([\`1234567\`](https://github.com/x/y/commit/1234567))

## [v2.77.9] - 2026-09-14

### Refactor

- solo refactor ([\`abcdef1\`](https://github.com/x/y/commit/abcdef1))

---

# Historico (previo al versionado)

## Abril 2026

### Novedades

- add something ([\`fa47baa\`](https://github.com/x/y/commit/fa47baa))
`

describe('parseChangelog', () => {
  const releases = parseChangelog(MD)

  it('lista las versiones etiquetadas y deja fuera el histórico', () => {
    expect(releases.map((r) => r.version)).toEqual(['v2.78.1', 'v2.78.0'])
    expect(releases[0].date).toBe('2026-09-16')
  })

  it('quita los links a los commits', () => {
    expect(releases[0].markdown).toBe(
      '### Correcciones\n\n- **reparto:** avisar cuando no hay puntos'
    )
  })

  it('omite las secciones que el comerciante no necesita y las versiones que quedan vacías', () => {
    expect(releases[1].markdown).not.toContain('Refactor')
    expect(releases.find((r) => r.version === 'v2.77.9')).toBeUndefined()
  })
})
