import { describe, it, expect } from 'vitest'
import { normalizeProduct, normalizeProductImages } from '../products.api'

describe('normalizeProduct', () => {
  const raw = {
    id: 30957,
    sku: 'BB2FFBABC3E9',
    name: 'CHOCOLATE BITTER 70% 100GR',
    barcode: '7753228001160',
    price: '25.90',
    stock: 12,
  }

  it('conserva los campos que el API ya envia', () => {
    const p = normalizeProduct(raw)
    expect(p.barcode).toBe('7753228001160')
    expect(p.sku).toBe('BB2FFBABC3E9')
    expect(p.name).toBe('CHOCOLATE BITTER 70% 100GR')
  })

  it('deja pasar campos que la normalizacion no lista (la regresion que motivo el spread)', () => {
    const p = normalizeProduct({
      ...raw,
      gamma: { id: 7, name: 'Linea Organica' },
      lots_managed: true,
      shipping_conversion_factor: 2.5,
      shipping_per_unit: true,
      campo_futuro_del_api: 'sobrevive',
    }) as any

    expect(p.gamma).toEqual({ id: 7, name: 'Linea Organica' })
    expect(p.lots_managed).toBe(true)
    expect(p.shipping_conversion_factor).toBe(2.5)
    expect(p.shipping_per_unit).toBe(true)
    expect(p.campo_futuro_del_api).toBe('sobrevive')
  })

  it('convierte los numeros que el API manda como string', () => {
    const p = normalizeProduct({ ...raw, weight: '0.25', order: '3' })
    expect(p.price).toBe(25.9)
    expect(p.weight).toBe(0.25)
    expect(p.order).toBe(3)
  })

  it('aplica los valores por defecto', () => {
    const p = normalizeProduct({ id: 1, sku: 'X', name: 'X' })
    expect(p.price).toBe(0)
    expect(p.stock).toBe(0)
    expect(p.igv_percent).toBe(18)
    expect(p.tax_affectation).toBe(1)
    expect(p.max_purchase_qty).toBe(0)
    expect(p.published_pos).toBe(true)
    expect(p.images).toEqual([])
  })

  it('normaliza los flags que PHP manda como 1/0', () => {
    const p = normalizeProduct({ ...raw, unlimited_stock: 1, icbper: 1, has_variation_attributes: 0 })
    expect(p.unlimited_stock).toBe(true)
    expect(p.icbper).toBe(true)
    expect(p.has_variation_attributes).toBe(false)
  })
})

describe('normalizeProductImages', () => {
  it('acepta un array de strings', () => {
    const [img] = normalizeProductImages(['https://cdn/foo.jpg'])
    expect(img.url).toBe('https://cdn/foo.jpg')
    expect(img.thumbnail).toBe('https://cdn/foo.jpg')
    expect(img.is_main).toBe(true)
  })

  it('completa thumbnail e is_main en los objetos del API', () => {
    const [img] = normalizeProductImages([{ id: 9, url: 'https://cdn/bar.jpg' }])
    expect(img.id).toBe(9)
    expect(img.thumbnail).toBe('https://cdn/bar.jpg')
    expect(img.is_main).toBe(true)
  })

  it('descarta placeholders externos', () => {
    expect(normalizeProductImages(['https://via.placeholder.com/300'])).toEqual([])
  })
})
