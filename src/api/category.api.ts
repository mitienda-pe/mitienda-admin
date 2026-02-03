import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type { Category, CategoryFormData } from '@/types/product.types'

// Transform raw API response to Category (recursive for subcategories)
const transformCategory = (raw: any): Category => ({
  id: parseInt(raw.tiendacategoria_id),
  name: raw.tiendacategoria_nombre,
  slug: raw.tiendacategoria_nombreurl,
  parent_id: raw.parent_id ? parseInt(raw.parent_id) : undefined,
  image_id: raw.tiendaimagen_id ? parseInt(raw.tiendaimagen_id) : undefined,
  order: raw.tiendacategoria_orden !== undefined ? parseInt(raw.tiendacategoria_orden) : undefined,
  meta_title: raw.tiendacategoria_meta_tittle || undefined,
  meta_description: raw.tiendacategoria_meta_description || undefined,
  sub: raw.sub ? raw.sub.map(transformCategory) : undefined
})

// Transform Category form data to API format
const transformToApi = (data: CategoryFormData): Record<string, any> => {
  const result: Record<string, any> = {
    name: data.name,
    slug: data.slug,
    order: data.order,
    meta_title: data.meta_title,
    meta_description: data.meta_description
  }

  // Only include parent_id if it has a valid value (not null/undefined/0)
  if (data.parent_id && data.parent_id > 0) {
    result.parent_id = data.parent_id
  }

  // Only include image if provided
  if (data.image) {
    result.image = data.image
  }

  return result
}

// Flatten nested categories into a flat array
const flattenCategories = (categories: Category[]): Category[] => {
  const result: Category[] = []

  const flatten = (cats: Category[]) => {
    for (const cat of cats) {
      result.push(cat)
      if (cat.sub && cat.sub.length > 0) {
        flatten(cat.sub)
      }
    }
  }

  flatten(categories)
  return result
}

export const categoryApi = {
  // List all categories (returns hierarchical structure)
  async getAll(): Promise<ApiResponse<Category[]>> {
    const response = await apiClient.get('/categories')
    const rawData = response.data

    if (Array.isArray(rawData)) {
      const categories = rawData.map(transformCategory)
      return { success: true, data: categories }
    }

    return { success: false, data: [] }
  },

  // Get flat list of all categories (useful for dropdowns)
  async getAllFlat(): Promise<ApiResponse<Category[]>> {
    const response = await this.getAll()
    if (response.success && response.data) {
      const flatCategories = flattenCategories(response.data)
      return { success: true, data: flatCategories }
    }
    return response
  },

  // Get single category by ID
  async getById(id: number): Promise<ApiResponse<Category>> {
    const response = await apiClient.get(`/categories/${id}`)
    const category = transformCategory(response.data)
    return { success: true, data: category }
  },

  // Create new category
  async create(data: CategoryFormData): Promise<ApiResponse<Category>> {
    const response = await apiClient.post('/categories', transformToApi(data))
    const category = transformCategory(response.data)
    return { success: true, data: category }
  },

  // Update existing category
  async update(id: number, data: CategoryFormData): Promise<ApiResponse<Category>> {
    const response = await apiClient.put(`/categories/${id}`, transformToApi(data))
    const category = transformCategory(response.data)
    return { success: true, data: category }
  },

  // Delete category
  async delete(id: number): Promise<ApiResponse<void>> {
    await apiClient.delete(`/categories/${id}`)
    return { success: true }
  }
}
