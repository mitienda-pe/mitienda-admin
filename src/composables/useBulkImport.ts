import { ref, computed } from 'vue'
import { categoryApi } from '@/api/category.api'
import { brandApi } from '@/api/brand.api'
import { gammaApi } from '@/api/gamma.api'
import { productManagementApi } from '@/api/product-management.api'
import { productsApi } from '@/api/products.api'
import { useAppearanceConfigStore } from '@/stores/appearance-config.store'
import type { Category, ProductCreatePayload } from '@/types/product.types'
import type { Gamma } from '@/types/gamma.types'
import type { BulkCsvParsedRow, BulkProcessingResult, BulkImportSummary } from '@/types/product.types'
import {
  CSV_COLUMNS,
  REQUIRED_COLUMNS,
  parseCsvString,
  generateCsvString,
  downloadCsv,
  downloadBlob,
  normalizeUnit,
  type CsvColumnDef,
} from '@/utils/csv-helpers'

export function useBulkImport() {
  // ── State ──
  const mode = ref<'create' | 'edit'>('create')
  const step = ref(1)
  const selectedColumns = ref<string[]>([...REQUIRED_COLUMNS])
  const parsedRows = ref<BulkCsvParsedRow[]>([])
  const results = ref<BulkProcessingResult[]>([])
  const isProcessing = ref(false)
  const isPaused = ref(false)
  const isCancelled = ref(false)
  const processingIndex = ref(0)
  const isLoadingRef = ref(false)
  const refDataLoaded = ref(false)

  // Reference data
  const categoryPathMap = ref<Map<string, number>>(new Map())
  const brandNameMap = ref<Map<string, number>>(new Map())
  const gammasByBrand = ref<Map<number, { id: number; name: string }[]>>(new Map())
  const pricingMode = ref(0) // 0 = con IGV, 1 = sin IGV

  // ── Computed ──
  const validRows = computed(() => parsedRows.value.filter(r => r.isValid))
  const invalidRows = computed(() => parsedRows.value.filter(r => !r.isValid))
  const successResults = computed(() => results.value.filter(r => r.success))
  const errorResults = computed(() => results.value.filter(r => !r.success))

  const summary = computed<BulkImportSummary>(() => ({
    total: results.value.length,
    created: results.value.filter(r => r.success && r.action === 'created').length,
    updated: results.value.filter(r => r.success && r.action === 'updated').length,
    errors: results.value.filter(r => !r.success).length,
    skipped: results.value.filter(r => r.action === 'skipped').length,
  }))

  const progressPercent = computed(() => {
    if (parsedRows.value.length === 0) return 0
    return Math.round((processingIndex.value / validRows.value.length) * 100)
  })

  // ── Reference Data Loading ──

  async function loadReferenceData() {
    if (refDataLoaded.value) return
    isLoadingRef.value = true
    try {
      const [catRes, brandRes, gammaRes] = await Promise.all([
        categoryApi.getAll(),
        brandApi.getAll(),
        gammaApi.getAll(),
      ])

      // Build category path map
      if (catRes.success && catRes.data) {
        const map = new Map<string, number>()
        buildCategoryPathMap(catRes.data, [], map)
        categoryPathMap.value = map
      }

      // Build brand name map
      if (brandRes.success && brandRes.data) {
        const map = new Map<string, number>()
        for (const b of brandRes.data) {
          map.set(b.name.trim().toLowerCase(), b.id)
        }
        brandNameMap.value = map
      }

      // Build gammas grouped by brand
      if (gammaRes.success && gammaRes.data) {
        const map = new Map<number, { id: number; name: string }[]>()
        for (const g of gammaRes.data as Gamma[]) {
          const brandId = g.tiendamarca_id
          const list = map.get(brandId) || []
          list.push({ id: g.tiendagamma_id, name: g.tiendagamma_nombre })
          map.set(brandId, list)
        }
        gammasByBrand.value = map
      }

      // Load pricing mode
      const configStore = useAppearanceConfigStore()
      if (!configStore.isCatalogLoaded) {
        await configStore.fetchCatalogPreferences()
      }
      pricingMode.value = configStore.draftCatalog.pricing_mode ?? 0

      refDataLoaded.value = true
    } finally {
      isLoadingRef.value = false
    }
  }

  function buildCategoryPathMap(
    categories: Category[],
    parentPath: string[],
    map: Map<string, number>
  ) {
    for (const cat of categories) {
      const currentPath = [...parentPath, cat.name.trim()]
      const pathKey = currentPath.join(' > ').toLowerCase()
      map.set(pathKey, cat.id)
      if (cat.sub && cat.sub.length > 0) {
        buildCategoryPathMap(cat.sub, currentPath, map)
      }
    }
  }

  // ── Resolvers ──

  function resolveCategories(csvValue: string): { ids: number[]; warnings: string[] } {
    if (!csvValue.trim()) return { ids: [], warnings: [] }
    const paths = csvValue.split(',').map(p => p.trim())
    const ids: number[] = []
    const warnings: string[] = []

    for (const path of paths) {
      if (!path) continue
      const key = path.toLowerCase()
      const id = categoryPathMap.value.get(key)
      if (id) {
        ids.push(id)
      } else {
        warnings.push(`Categoria no encontrada: "${path}"`)
      }
    }
    return { ids, warnings }
  }

  function resolveBrand(name: string): { id: number | null; warning?: string } {
    if (!name.trim()) return { id: null }
    const id = brandNameMap.value.get(name.trim().toLowerCase())
    if (id) return { id }
    return { id: null, warning: `Marca no encontrada: "${name}"` }
  }

  function resolveGamma(
    name: string,
    brandId: number | null
  ): { id: number | null; warning?: string } {
    if (!name.trim()) return { id: null }
    if (!brandId) return { id: null, warning: `Gamma "${name}" requiere una marca valida` }

    const gammas = gammasByBrand.value.get(brandId) || []
    const match = gammas.find(g => g.name.trim().toLowerCase() === name.trim().toLowerCase())
    if (match) return { id: match.id }
    return { id: null, warning: `Gamma no encontrada: "${name}"` }
  }

  // ── Template Generation ──

  function generateCreateTemplate(columns: string[]) {
    const columnDefs = columns
      .map(key => CSV_COLUMNS.find(c => c.key === key))
      .filter((c): c is CsvColumnDef => !!c)

    const headers = columnDefs.map(c => c.key)
    const mockRows = getMockRows(columnDefs)
    const csv = generateCsvString(headers, mockRows)
    downloadCsv(csv, `plantilla_productos_crear_${new Date().toISOString().slice(0, 10)}.csv`)
  }

  function getMockRows(columns: CsvColumnDef[]): string[][] {
    const row1: string[] = []
    const row2: string[] = []

    for (const col of columns) {
      switch (col.key) {
        case 'nombre': row1.push('Camiseta Basica Blanca'); row2.push('Pantalon Jean Azul'); break
        case 'sku': row1.push('CAM-BAS-001'); row2.push('PAN-JEA-001'); break
        case 'codigo_barras': row1.push('7501234567890'); row2.push('7501234567891'); break
        case 'precio': row1.push('49.90'); row2.push('129.90'); break
        case 'stock': row1.push('100'); row2.push('50'); break
        case 'stock_ilimitado': row1.push('0'); row2.push('0'); break
        case 'descripcion': row1.push('Camiseta de algodon 100%'); row2.push('Jean clasico corte recto'); break
        case 'descripcion_corta': row1.push('Camiseta basica'); row2.push('Jean clasico'); break
        case 'categorias': row1.push('Hombre > Ropa > Camisetas'); row2.push('Hombre > Ropa > Pantalones'); break
        case 'marca': row1.push('Mi Marca'); row2.push('Mi Marca'); break
        case 'gamma': row1.push('Linea Casual'); row2.push('Linea Clasica'); break
        case 'publicado': row1.push('1'); row2.push('1'); break
        case 'orden': row1.push('1'); row2.push('2'); break
        case 'meta_titulo': row1.push('Camiseta Basica'); row2.push('Pantalon Jean'); break
        case 'meta_descripcion': row1.push('Compra camiseta basica'); row2.push('Compra pantalon jean'); break
        case 'slug': row1.push('camiseta-basica-blanca'); row2.push('pantalon-jean-azul'); break
        case 'peso': row1.push('0.2'); row2.push('0.5'); break
        case 'unidad_peso': row1.push('kilogramos'); row2.push('kilogramos'); break
        case 'alto': row1.push('5'); row2.push('10'); break
        case 'ancho': row1.push('30'); row2.push('35'); break
        case 'largo': row1.push('40'); row2.push('100'); break
        case 'unidad_dimensiones': row1.push('centimetros'); row2.push('centimetros'); break
        default: row1.push(''); row2.push('')
      }
    }

    return [row1, row2]
  }

  async function downloadEditTemplate(columns: string[]) {
    const blob = await productManagementApi.exportBulk(columns)
    downloadBlob(blob, `plantilla_productos_editar_${new Date().toISOString().slice(0, 10)}.csv`)
  }

  // ── CSV Parsing & Validation ──

  function parseCsvFile(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = e => {
        try {
          const text = e.target?.result as string
          const { headers, rows } = parseCsvString(text)

          if (rows.length === 0) {
            reject(new Error('El archivo CSV esta vacio'))
            return
          }

          // Validate required headers for create mode
          if (mode.value === 'create') {
            const missingHeaders = REQUIRED_COLUMNS.filter(
              col => !headers.includes(col)
            )
            if (missingHeaders.length > 0) {
              reject(new Error(`Columnas requeridas faltantes: ${missingHeaders.join(', ')}`))
              return
            }
          }

          // Validate edit mode has id or sku
          if (mode.value === 'edit') {
            if (!headers.includes('id') && !headers.includes('sku')) {
              reject(new Error('El CSV debe incluir la columna "id" o "sku" para identificar productos'))
              return
            }
          }

          // Parse and validate each row
          const skuSet = new Set<string>()
          const parsed: BulkCsvParsedRow[] = rows.map((raw, index) => {
            const errors: string[] = []
            const warnings: string[] = []
            const mapped: Record<string, any> = {}

            for (const header of headers) {
              const colDef = CSV_COLUMNS.find(c => c.key === header)
              if (!colDef) continue

              const value = raw[header] ?? ''

              // Required check (create mode)
              if (mode.value === 'create' && colDef.required && !value) {
                errors.push(`Campo "${colDef.label}" es obligatorio`)
                continue
              }

              if (!value) continue

              // Type validation & mapping
              if (colDef.key === 'precio') {
                const num = parseFloat(value)
                if (isNaN(num)) {
                  errors.push(`"${colDef.label}" debe ser un numero`)
                } else if (num < 0) {
                  errors.push(`"${colDef.label}" debe ser mayor o igual a 0`)
                } else {
                  // Map based on pricing_mode
                  if (pricingMode.value === 1) {
                    mapped.price_without_tax = num
                  } else {
                    mapped.price = num
                  }
                }
              } else if (colDef.key === 'categorias') {
                const { ids, warnings: catWarnings } = resolveCategories(value)
                if (ids.length > 0) mapped.categories = ids
                warnings.push(...catWarnings)
              } else if (colDef.key === 'marca') {
                const { id, warning } = resolveBrand(value)
                if (id) mapped.brand_id = id
                if (warning) warnings.push(warning)
              } else if (colDef.key === 'gamma') {
                // Will be resolved after brand is processed
                mapped._gamma_name = value
              } else if (colDef.key === 'id') {
                mapped._id = parseInt(value)
                if (isNaN(mapped._id)) errors.push('"ID" debe ser un numero')
              } else if (colDef.key === 'unidad_peso') {
                const normalized = normalizeUnit(value, 'weight')
                if (normalized) {
                  mapped.weight_unit = normalized
                } else {
                  errors.push(`Unidad de peso no valida: "${value}". Use: kilogramos, gramos, libras`)
                }
              } else if (colDef.key === 'unidad_dimensiones') {
                const normalized = normalizeUnit(value, 'dimension')
                if (normalized) {
                  mapped.dimensions_unit = normalized
                } else {
                  errors.push(`Unidad de dimensiones no valida: "${value}". Use: centimetros, metros, pulgadas`)
                }
              } else if (colDef.type === 'number') {
                const num = parseFloat(value)
                if (isNaN(num)) {
                  errors.push(`"${colDef.label}" debe ser un numero`)
                } else {
                  mapped[colDef.apiField] = num
                }
              } else if (colDef.type === 'boolean') {
                mapped[colDef.apiField] = value === '1' || value.toLowerCase() === 'true'
              } else {
                mapped[colDef.apiField] = value
              }
            }

            // Resolve gamma after brand
            if (mapped._gamma_name && mapped.brand_id) {
              const { id, warning } = resolveGamma(mapped._gamma_name, mapped.brand_id)
              if (id) mapped.gamma_id = id
              if (warning) warnings.push(warning)
            } else if (mapped._gamma_name && !mapped.brand_id) {
              warnings.push(`Gamma "${mapped._gamma_name}" ignorada: se requiere una marca valida`)
            }
            delete mapped._gamma_name

            // Duplicate SKU check (create mode)
            if (mode.value === 'create' && mapped.sku) {
              if (skuSet.has(mapped.sku.toLowerCase())) {
                errors.push(`SKU "${mapped.sku}" duplicado en el archivo`)
              } else {
                skuSet.add(mapped.sku.toLowerCase())
              }
            }

            return {
              rowNumber: index + 2, // +2 for 1-indexed + header row
              raw,
              mapped,
              errors,
              warnings,
              isValid: errors.length === 0,
            }
          })

          parsedRows.value = parsed
          resolve()
        } catch (err) {
          reject(err)
        }
      }
      reader.onerror = () => reject(new Error('Error al leer el archivo'))
      reader.readAsText(file)
    })
  }

  // ── Processing ──

  async function startProcessing() {
    isProcessing.value = true
    isPaused.value = false
    isCancelled.value = false
    processingIndex.value = 0
    results.value = []

    const rowsToProcess = validRows.value

    for (let i = 0; i < rowsToProcess.length; i++) {
      if (isCancelled.value) break

      // Wait while paused
      while (isPaused.value) {
        await new Promise(resolve => setTimeout(resolve, 200))
        if (isCancelled.value) break
      }
      if (isCancelled.value) break

      processingIndex.value = i + 1
      const row = rowsToProcess[i]
      const result = await processRow(row)
      results.value.push(result)
    }

    // Add skipped rows (invalid ones)
    for (const row of invalidRows.value) {
      results.value.push({
        rowNumber: row.rowNumber,
        sku: row.raw.sku || '',
        productName: row.raw.nombre || '',
        success: false,
        action: 'skipped',
        error: row.errors.join('; '),
      })
    }

    isProcessing.value = false
  }

  async function processRow(row: BulkCsvParsedRow): Promise<BulkProcessingResult> {
    const { mapped, raw } = row
    const payload = { ...mapped }
    const productId = payload._id
    delete payload._id

    // Retry logic
    let lastError = ''
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        if (mode.value === 'create') {
          const res = await productManagementApi.createProduct(payload as ProductCreatePayload)
          if (res.success) {
            return {
              rowNumber: row.rowNumber,
              sku: raw.sku || '',
              productName: raw.nombre || '',
              success: true,
              action: 'created',
              productId: res.data?.id,
            }
          }
          lastError = res.message || 'Error desconocido'
          break // Don't retry validation errors
        } else {
          if (!productId) {
            return {
              rowNumber: row.rowNumber,
              sku: raw.sku || '',
              productName: raw.nombre || '',
              success: false,
              action: 'skipped',
              error: 'No se pudo identificar el producto (falta ID)',
            }
          }
          const res = await productsApi.updateProduct(productId, payload)
          if (res.success) {
            return {
              rowNumber: row.rowNumber,
              sku: raw.sku || '',
              productName: raw.nombre || '',
              success: true,
              action: 'updated',
              productId,
            }
          }
          lastError = res.message || 'Error desconocido'
          break // Don't retry validation errors
        }
      } catch (err: any) {
        lastError = err.response?.data?.messages
          ? Object.values(err.response.data.messages).flat().join('; ')
          : err.response?.data?.message || err.message || 'Error de conexion'

        // Only retry on network errors
        if (!err.response && attempt < 2) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
          continue
        }
        break
      }
    }

    return {
      rowNumber: row.rowNumber,
      sku: raw.sku || '',
      productName: raw.nombre || '',
      success: false,
      action: mode.value === 'create' ? 'created' : 'updated',
      error: lastError,
    }
  }

  function pauseProcessing() {
    isPaused.value = true
  }

  function resumeProcessing() {
    isPaused.value = false
  }

  function cancelProcessing() {
    isCancelled.value = true
    isPaused.value = false
  }

  // ── Error Report ──

  function downloadErrorReport() {
    const failedRows = results.value.filter(r => !r.success)
    if (failedRows.length === 0) return

    const headers = ['fila', 'nombre', 'sku', 'estado', 'error']
    const rows = failedRows.map(r => [
      r.rowNumber.toString(),
      r.productName,
      r.sku,
      'ERROR',
      r.error || '',
    ])
    const csv = generateCsvString(headers, rows)
    downloadCsv(csv, `errores_importacion_${new Date().toISOString().slice(0, 10)}.csv`)
  }

  // ── Reset ──

  function reset() {
    mode.value = 'create'
    step.value = 1
    selectedColumns.value = [...REQUIRED_COLUMNS]
    parsedRows.value = []
    results.value = []
    isProcessing.value = false
    isPaused.value = false
    isCancelled.value = false
    processingIndex.value = 0
  }

  return {
    // State
    mode,
    step,
    selectedColumns,
    parsedRows,
    results,
    isProcessing,
    isPaused,
    processingIndex,
    isLoadingRef,
    pricingMode,

    // Computed
    validRows,
    invalidRows,
    successResults,
    errorResults,
    summary,
    progressPercent,

    // Actions
    loadReferenceData,
    generateCreateTemplate,
    downloadEditTemplate,
    parseCsvFile,
    startProcessing,
    pauseProcessing,
    resumeProcessing,
    cancelProcessing,
    downloadErrorReport,
    reset,
  }
}
