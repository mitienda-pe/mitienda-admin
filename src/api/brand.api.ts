import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type { Brand, BrandFormData } from '@/types/product.types'

// Transform raw API response to Brand
const transformBrand = (raw: any): Brand => ({
  id: parseInt(raw.tiendamarca_id),
  name: raw.tiendamarca_nombre,
  slug: raw.tiendamarca_nombreurl,
  logo: raw.tiendaimagen_id ? undefined : undefined, // TODO: fetch image URL if needed
  image_id: raw.tiendaimagen_id ? parseInt(raw.tiendaimagen_id) : undefined,
  meta_title: raw.tiendamarca_meta_tittle || undefined,
  meta_description: raw.tiendamarca_meta_description || undefined
})

// Transform Brand form data to API format
const transformToApi = (data: BrandFormData): Record<string, any> => ({
  name: data.name,
  slug: data.slug,
  image: data.image,
  meta_title: data.meta_title,
  meta_description: data.meta_description
})

export const brandApi = {
  // List all brands
  async getAll(): Promise<ApiResponse<Brand[]>> {
    const response = await apiClient.get('/brands')
    const rawData = response.data

    if (Array.isArray(rawData)) {
      const brands = rawData.map(transformBrand)
      return { success: true, data: brands }
    }

    return { success: false, data: [] }
  },

  // Get single brand by ID
  async getById(id: number): Promise<ApiResponse<Brand>> {
    const response = await apiClient.get(`/brands/${id}`)
    const brand = transformBrand(response.data)
    return { success: true, data: brand }
  },

  // Create new brand
  async create(data: BrandFormData): Promise<ApiResponse<Brand>> {
    const response = await apiClient.post('/brands', transformToApi(data))
    const brand = transformBrand(response.data)
    return { success: true, data: brand }
  },

  // Update existing brand
  async update(id: number, data: BrandFormData): Promise<ApiResponse<Brand>> {
    const response = await apiClient.put(`/brands/${id}`, transformToApi(data))
    const brand = transformBrand(response.data)
    return { success: true, data: brand }
  },

  // Delete brand
  async delete(id: number): Promise<ApiResponse<void>> {
    await apiClient.delete(`/brands/${id}`)
    return { success: true }
  }
}
