import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const exportBulk = vi.fn()

vi.mock('@/api/product-management.api', () => ({
  productManagementApi: {
    exportBulk: (...args: any[]) => exportBulk(...args),
    createProduct: vi.fn(),
  },
}))
vi.mock('@/api/category.api', () => ({ categoryApi: { getAll: vi.fn() } }))
vi.mock('@/api/brand.api', () => ({ brandApi: { getAll: vi.fn() } }))
vi.mock('@/api/gamma.api', () => ({ gammaApi: { getAll: vi.fn() } }))
vi.mock('@/api/products.api', () => ({ productsApi: { updateProduct: vi.fn() } }))

import { useBulkImport } from '../useBulkImport'

// El catalogo que devuelve /products/export-bulk: id, nombre y sku siempre.
const CATALOGO = `id,nombre,sku
30704,AVENA INTEGRAL 500GR,AVE-001
30706,HOJUELAS DE AVENA,HOJ-002
30922,YOGURT NATURAL,DUP-9
30923,YOGURT DE MORA,DUP-9
`

function csvFile(content: string): File {
  return new File([content], 'productos.csv', { type: 'text/csv' })
}

describe('useBulkImport - edicion por SKU', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    exportBulk.mockReset()
    exportBulk.mockResolvedValue(new Blob([CATALOGO], { type: 'text/csv' }))
  })

  it('resuelve el id del producto a partir del SKU', async () => {
    const bulk = useBulkImport()
    bulk.mode.value = 'edit'

    await bulk.parseCsvFile(csvFile('sku,codigo_barras\nAVE-001,765066781460\n'))

    expect(exportBulk).toHaveBeenCalledWith(['sku'])
    const [row] = bulk.parsedRows.value
    expect(row.isValid).toBe(true)
    expect(row.mapped._id).toBe(30704)
    expect(row.mapped.barcode).toBe('765066781460')
  })

  it('marca la fila cuando el SKU no existe en el catalogo', async () => {
    const bulk = useBulkImport()
    bulk.mode.value = 'edit'

    await bulk.parseCsvFile(csvFile('sku,codigo_barras\nNO-EXISTE,123\n'))

    const [row] = bulk.parsedRows.value
    expect(row.isValid).toBe(false)
    expect(row.errors[0]).toContain('no existe en el catalogo')
  })

  it('rechaza la fila si el SKU esta repetido en el catalogo', async () => {
    const bulk = useBulkImport()
    bulk.mode.value = 'edit'

    await bulk.parseCsvFile(csvFile('sku,codigo_barras\nDUP-9,123\n'))

    const [row] = bulk.parsedRows.value
    expect(row.isValid).toBe(false)
    expect(row.errors[0]).toContain('repetido en el catalogo')
  })

  it('no descarga el catalogo cuando el CSV ya trae la columna id', async () => {
    const bulk = useBulkImport()
    bulk.mode.value = 'edit'

    await bulk.parseCsvFile(csvFile('id,codigo_barras\n30704,765066781460\n'))

    expect(exportBulk).not.toHaveBeenCalled()
    expect(bulk.parsedRows.value[0].mapped._id).toBe(30704)
  })

  it('exige id o sku antes de descargar nada', async () => {
    const bulk = useBulkImport()
    bulk.mode.value = 'edit'

    await expect(
      bulk.parseCsvFile(csvFile('codigo_barras\n765066781460\n')),
    ).rejects.toThrow(/"id" o "sku"/)
    expect(exportBulk).not.toHaveBeenCalled()
  })
})
