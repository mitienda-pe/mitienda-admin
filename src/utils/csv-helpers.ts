// ── CSV Column Definitions ──

export interface CsvColumnDef {
  key: string
  apiField: string
  label: string
  required: boolean
  type: 'string' | 'number' | 'boolean'
  group: string
  editOnly?: boolean
}

export const CSV_COLUMNS: CsvColumnDef[] = [
  // Identificacion
  { key: 'id', apiField: '_id', label: 'ID', required: false, type: 'number', group: 'Identificacion', editOnly: true },
  // Basico
  { key: 'nombre', apiField: 'name', label: 'Nombre', required: true, type: 'string', group: 'Basico' },
  { key: 'sku', apiField: 'sku', label: 'SKU', required: true, type: 'string', group: 'Basico' },
  { key: 'codigo_barras', apiField: 'barcode', label: 'Codigo de Barras', required: false, type: 'string', group: 'Basico' },
  // Precios (dynamically mapped based on pricing_mode)
  { key: 'precio', apiField: 'price', label: 'Precio', required: true, type: 'number', group: 'Precios' },
  // Inventario
  { key: 'stock', apiField: 'stock', label: 'Stock', required: true, type: 'number', group: 'Inventario' },
  { key: 'stock_ilimitado', apiField: 'unlimited_stock', label: 'Stock Ilimitado (0/1)', required: false, type: 'boolean', group: 'Inventario' },
  // Contenido
  { key: 'descripcion', apiField: 'description', label: 'Descripcion', required: false, type: 'string', group: 'Contenido' },
  { key: 'descripcion_corta', apiField: 'description_short', label: 'Descripcion Corta', required: false, type: 'string', group: 'Contenido' },
  // Clasificacion
  { key: 'categorias', apiField: 'categories', label: 'Categorias', required: false, type: 'string', group: 'Clasificacion' },
  { key: 'marca', apiField: 'brand_id', label: 'Marca', required: false, type: 'string', group: 'Clasificacion' },
  { key: 'gamma', apiField: 'gamma_id', label: 'Gamma', required: false, type: 'string', group: 'Clasificacion' },
  // Estado
  { key: 'publicado', apiField: 'published', label: 'Publicado (0/1)', required: false, type: 'boolean', group: 'Estado' },
  { key: 'orden', apiField: 'order', label: 'Orden', required: false, type: 'number', group: 'Estado' },
  // SEO
  { key: 'meta_titulo', apiField: 'meta_title', label: 'Meta Titulo', required: false, type: 'string', group: 'SEO' },
  { key: 'meta_descripcion', apiField: 'meta_description', label: 'Meta Descripcion', required: false, type: 'string', group: 'SEO' },
  { key: 'slug', apiField: 'slug', label: 'Slug', required: false, type: 'string', group: 'SEO' },
  // Dimensiones
  { key: 'peso', apiField: 'weight', label: 'Peso', required: false, type: 'number', group: 'Dimensiones' },
  { key: 'unidad_peso', apiField: 'weight_unit', label: 'Unidad Peso', required: false, type: 'string', group: 'Dimensiones' },
  { key: 'alto', apiField: 'height', label: 'Alto', required: false, type: 'number', group: 'Dimensiones' },
  { key: 'ancho', apiField: 'width', label: 'Ancho', required: false, type: 'number', group: 'Dimensiones' },
  { key: 'largo', apiField: 'length', label: 'Largo', required: false, type: 'number', group: 'Dimensiones' },
  { key: 'unidad_dimensiones', apiField: 'dimensions_unit', label: 'Unidad Dimensiones', required: false, type: 'string', group: 'Dimensiones' },
]

export const REQUIRED_COLUMNS = CSV_COLUMNS.filter(c => c.required).map(c => c.key)

// ── Unit Normalization ──

const WEIGHT_UNIT_MAP: Record<string, string> = {
  kilogramos: 'kilogramos',
  kg: 'kilogramos',
  gramos: 'gramos',
  g: 'gramos',
  libras: 'libras',
  lb: 'libras',
}

const DIMENSION_UNIT_MAP: Record<string, string> = {
  centimetros: 'centimetros',
  cm: 'centimetros',
  metros: 'metros',
  m: 'metros',
  pulgadas: 'pulgadas',
  in: 'pulgadas',
}

export function normalizeUnit(value: string, type: 'weight' | 'dimension'): string | null {
  const map = type === 'weight' ? WEIGHT_UNIT_MAP : DIMENSION_UNIT_MAP
  return map[value.trim().toLowerCase()] ?? null
}

// ── CSV Parsing ──

export function parseCsvString(text: string): { headers: string[]; rows: Record<string, string>[] } {
  // Remove UTF-8 BOM
  const cleaned = text.replace(/^\uFEFF/, '')
  const lines = splitCsvLines(cleaned)
  if (lines.length === 0) return { headers: [], rows: [] }

  const headers = parseCsvRow(lines[0]).map(h => h.trim().toLowerCase())
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvRow(lines[i])
    // Skip empty rows
    if (values.every(v => v.trim() === '')) continue
    const row: Record<string, string> = {}
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = (values[j] ?? '').trim()
    }
    rows.push(row)
  }

  return { headers, rows }
}

function splitCsvLines(text: string): string[] {
  const lines: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '"') {
      inQuotes = !inQuotes
      current += ch
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && text[i + 1] === '\n') i++
      if (current.length > 0) lines.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  if (current.length > 0) lines.push(current)
  return lines
}

function parseCsvRow(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        values.push(current)
        current = ''
      } else {
        current += ch
      }
    }
  }
  values.push(current)
  return values
}

// ── CSV Generation ──

export function generateCsvString(headers: string[], rows: string[][]): string {
  const escapeField = (field: string): string => {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`
    }
    return field
  }

  const lines = [headers.map(escapeField).join(',')]
  for (const row of rows) {
    lines.push(row.map(escapeField).join(','))
  }
  return lines.join('\n')
}

export function downloadCsv(content: string, filename: string): void {
  // Add UTF-8 BOM for Excel compatibility
  const bom = '\uFEFF'
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

// ── Column Grouping Helper ──

export function getColumnGroups(mode: 'create' | 'edit'): { group: string; columns: CsvColumnDef[] }[] {
  const filtered = mode === 'create'
    ? CSV_COLUMNS.filter(c => !c.editOnly)
    : CSV_COLUMNS

  const groups = new Map<string, CsvColumnDef[]>()
  for (const col of filtered) {
    const list = groups.get(col.group) || []
    list.push(col)
    groups.set(col.group, list)
  }
  return Array.from(groups.entries()).map(([group, columns]) => ({ group, columns }))
}
