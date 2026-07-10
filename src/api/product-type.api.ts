import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type { ProductType } from '@/types/product.types'

export const productTypeApi = {
  // Lista los tipos de producto activos (físico/servicio/digital).
  // La API puede incluir tipos no públicos (ej. digital); el filtrado a
  // `publico` se hace en el store para los selectores.
  async getAll(): Promise<ApiResponse<ProductType[]>> {
    const response = await apiClient.get('/product-types')
    const raw = response.data?.data ?? response.data

    if (Array.isArray(raw)) {
      const types: ProductType[] = raw.map((t: any) => ({
        id: Number(t.id ?? t.productotipo_id),
        code: t.code ?? t.productotipo_codigo,
        name: t.name ?? t.productotipo_nombre,
        requires_shipping: t.requires_shipping === true || t.requires_shipping === 1,
        requires_address: t.requires_address === true || t.requires_address === 1,
        is_redeemable: t.is_redeemable === true || t.is_redeemable === 1,
        is_digital: t.is_digital === true || t.is_digital === 1,
        publico: t.publico === true || t.publico === 1
          || t.productotipo_publico === true || t.productotipo_publico === 1,
        orden: t.orden !== undefined ? Number(t.orden) : undefined,
        activo: t.activo === true || t.activo === 1
      }))
      return { success: true, data: types }
    }

    return { success: false, data: [] }
  }
}
