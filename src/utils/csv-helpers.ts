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
  { key: 'afectacion', apiField: 'tax_affectation', label: 'Afectacion IGV (1=Afecto,2=Exonerado,3=Inafecto)', required: false, type: 'number', group: 'Precios' },
  // ICBPER (Ley 30884): bolsa plastica. Monto fijo por bolsa (S/ 0.50) encima del IGV.
  { key: 'icbper', apiField: 'icbper', label: 'Bolsa plastica / ICBPER (0/1)', required: false, type: 'boolean', group: 'Precios' },
  // Inventario
  { key: 'stock', apiField: 'stock', label: 'Stock', required: true, type: 'number', group: 'Inventario' },
  { key: 'stock_ilimitado', apiField: 'unlimited_stock', label: 'Stock Ilimitado (0/1)', required: false, type: 'boolean', group: 'Inventario' },
  // Tope de unidades por compra. Solo surte efecto si la tienda tiene encendido
  // el limite de compra por producto (Configuracion de tienda).
  { key: 'cantidad_maxima', apiField: 'max_purchase_qty', label: 'Cantidad Maxima de Compra (0 = sin limite)', required: false, type: 'number', group: 'Inventario' },
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

// ── Header Matching ──

/**
 * Normaliza una cabecera del CSV para poder compararla: sin tildes, minusculas
 * y con "_" en lugar de espacios/simbolos. Asi "Codigo de barras", "CÓDIGO DE
 * BARRAS" y "codigo_barras" caen todas en la misma llave.
 */
export function normalizeCsvHeader(header: string): string {
  return header
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

/**
 * Sinonimos frecuentes: cabeceras que traen los archivos armados a mano o
 * exportados desde otras herramientas (Excel, ERP, el POS).
 */
const HEADER_ALIASES: Record<string, string> = {
  codigo_de_barra: 'codigo_barras',
  codigo_de_barras: 'codigo_barras',
  codigo_barra: 'codigo_barras',
  cod_barras: 'codigo_barras',
  barcode: 'codigo_barras',
  ean: 'codigo_barras',
  producto_id: 'id',
  id_producto: 'id',
  producto_sku: 'sku',
  nombre_del_producto: 'nombre',
}

// llave normalizada => definicion de columna (key, label y alias del apiField)
const HEADER_LOOKUP: Map<string, CsvColumnDef> = (() => {
  const map = new Map<string, CsvColumnDef>()
  for (const col of CSV_COLUMNS) {
    for (const candidate of [col.key, col.label, col.apiField]) {
      const norm = normalizeCsvHeader(candidate)
      if (norm && !map.has(norm)) map.set(norm, col)
    }
  }
  for (const [alias, key] of Object.entries(HEADER_ALIASES)) {
    const col = CSV_COLUMNS.find(c => c.key === key)
    if (col && !map.has(alias)) map.set(alias, col)
  }
  return map
})()

/**
 * Resuelve una cabecera del CSV a su columna. Devuelve undefined si no se
 * reconoce (el llamador debe avisar: una cabecera ignorada en silencio hace
 * que la importacion "funcione" sin escribir ese dato).
 */
export function findCsvColumn(header: string): CsvColumnDef | undefined {
  return HEADER_LOOKUP.get(normalizeCsvHeader(header))
}

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

export const CSV_DELIMITERS = [',', ';', '\t'] as const

/**
 * Detecta el separador de la cabecera. Excel en locales es-* guarda los CSV con
 * ";" (y decimales con coma), asi que no podemos asumir ",".
 */
export function detectCsvDelimiter(headerLine: string): string {
  let best = ','
  let bestCount = 0

  for (const delimiter of CSV_DELIMITERS) {
    const count = parseCsvRow(headerLine, delimiter).length
    if (count > bestCount) {
      best = delimiter
      bestCount = count
    }
  }

  return best
}

/**
 * Convierte un valor numerico del CSV a number respetando el locale del archivo.
 * Si el separador es ";" o tabulador, la coma es decimal y el punto es de miles
 * ("1.234,56" -> 1234.56). Con separador "," se deja tal cual.
 */
export function parseCsvNumber(value: string, delimiter: string = ','): number {
  let v = value.trim()
  if (delimiter !== ',' && v.includes(',')) {
    v = v.replace(/\./g, '').replace(',', '.')
  }
  return parseFloat(v)
}

export function parseCsvString(text: string): {
  headers: string[]
  rows: Record<string, string>[]
  delimiter: string
} {
  // Remove UTF-8 BOM
  const cleaned = text.replace(/^\uFEFF/, '')
  const lines = splitCsvLines(cleaned)
  if (lines.length === 0) return { headers: [], rows: [], delimiter: ',' }

  const delimiter = detectCsvDelimiter(lines[0])
  const headers = parseCsvRow(lines[0], delimiter).map(h => h.trim().toLowerCase())
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvRow(lines[i], delimiter)
    // Skip empty rows
    if (values.every(v => v.trim() === '')) continue
    const row: Record<string, string> = {}
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = (values[j] ?? '').trim()
    }
    rows.push(row)
  }

  return { headers, rows, delimiter }
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

function parseCsvRow(line: string, delimiter: string = ','): string[] {
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
      } else if (ch === delimiter) {
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
