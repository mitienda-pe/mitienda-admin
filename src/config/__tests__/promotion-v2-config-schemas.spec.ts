import { describe, it, expect } from 'vitest'
import {
  conditionProductIds,
  formatConfigHuman,
  getConfigSchema,
} from '@/config/promotion-v2-config-schemas'

describe('promotion-v2-config-schemas', () => {
  describe('conditionProductIds', () => {
    it('lee product_ids', () => {
      expect(conditionProductIds({ product_ids: [3, '5'] })).toEqual([3, 5])
    })

    it('acepta el product_id singular de las condiciones viejas', () => {
      expect(conditionProductIds({ product_id: 389574, quantity: 1 })).toEqual([389574])
    })

    it('devuelve vacío sin config', () => {
      expect(conditionProductIds(null)).toEqual([])
      expect(conditionProductIds({ quantity: 1 })).toEqual([])
    })
  })

  describe('cart_contains_product', () => {
    it('elige varios productos en una sola condición', () => {
      const field = getConfigSchema('conditions', 'cart_contains_product')?.[0]
      expect(field).toMatchObject({ key: 'product_ids', type: 'products-picker', required: true })
    })

    it('describe la condición con uno o varios productos', () => {
      expect(formatConfigHuman('conditions', 'cart_contains_product', { product_id: 7, quantity: 2 }))
        .toBe('Producto ID: 7, Cant: 2')
      expect(formatConfigHuman('conditions', 'cart_contains_product', { product_ids: [1, 2, 3] }))
        .toBe('Cualquiera de 3 productos, Cant: 1')
    })
  })
})
