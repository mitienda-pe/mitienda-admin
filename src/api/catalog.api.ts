import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type { Category, Brand } from '@/types/product.types'

export const catalogApi = {
  // Obtener todas las categorías
  async getCategories(): Promise<ApiResponse<Category[]>> {
    const response = await apiClient.get('/categories')
    const rawData = response.data

    // El API devuelve array directo sin transformar
    if (Array.isArray(rawData)) {
      // Aplanar categorías (extraer solo categorías padre, sin subcategorías por ahora)
      const categories: Category[] = rawData.map((cat: any) => ({
        id: parseInt(cat.tiendacategoria_id),
        name: cat.tiendacategoria_nombre,
        slug: cat.tiendacategoria_nombreurl,
        parent_id: parseInt(cat.parent_id || '0')
      }))

      return { success: true, data: categories }
    }

    return { success: false, data: [] }
  },

  // Obtener todas las marcas
  async getBrands(): Promise<ApiResponse<Brand[]>> {
    const response = await apiClient.get('/brands')
    const rawData = response.data

    // El API devuelve array directo sin transformar
    if (Array.isArray(rawData)) {
      const brands: Brand[] = rawData.map((brand: any) => ({
        id: parseInt(brand.tiendamarca_id),
        name: brand.tiendamarca_nombre,
        slug: brand.tiendamarca_nombreurl
      }))

      return { success: true, data: brands }
    }

    return { success: false, data: [] }
  }
}
