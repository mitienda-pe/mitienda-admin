import apiClient from './axios'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { Product } from '@/types/product.types'

export interface ProductsFilters {
  page?: number
  limit?: number
  search?: string
  category_id?: number | null
  brand_id?: number | null
  published?: boolean | null
  stock_status?: 'all' | 'in_stock' | 'limited' | 'out_of_stock'
}

export const productsApi = {
  // Listar productos con filtros y paginación
  async getProducts(filters: ProductsFilters = {}): Promise<PaginatedResponse<Product>> {
    const params = new URLSearchParams()

    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())
    if (filters.search) params.append('search', filters.search)
    if (filters.category_id) params.append('category_id', filters.category_id.toString())
    if (filters.brand_id) params.append('brand_id', filters.brand_id.toString())
    if (filters.published !== null && filters.published !== undefined) {
      params.append('published', filters.published ? '1' : '0')
    }
    if (filters.stock_status && filters.stock_status !== 'all') {
      params.append('stock_status', filters.stock_status)
    }

    const response = await apiClient.get(`/products?${params.toString()}`)

    // La API devuelve un array directo de productos
    const rawData = response.data

    if (Array.isArray(rawData)) {
      return {
        success: true,
        data: rawData.map((product: any) => {
          // Normalizar imágenes: API devuelve array de strings (URLs completas)
          const images = (product.images || [])
            .filter((img: any) => {
              // Filtrar placeholders externos
              const url = typeof img === 'string' ? img : (img.url || img)
              return url && !url.includes('placeholder.com')
            })
            .map((img: any, index: number) => {
              if (typeof img === 'string') {
                return {
                  id: index,
                  url: img,
                  thumbnail: img,
                  position: index,
                  is_main: index === 0
                }
              }
              return {
                id: img.id || index,
                url: img.url || img,
                thumbnail: img.thumbnail || img.url || img,
                position: img.position || index,
                is_main: img.is_main || index === 0
              }
            })

          return {
            id: product.id,
            sku: product.sku,
            name: product.name,
            description: product.description || '',
            description_html: product.description_html || '',
            price: parseFloat(product.price || '0'),
            stock: product.stock || 0,
            published: product.published || false,
            featured: product.featured || false,
            images,
            category: product.category || null,
            brand: product.brand || null,
            created_at: product.created_at || new Date().toISOString(),
            updated_at: product.updated_at || new Date().toISOString()
          }
        }),
        meta: {
          page: filters.page || 1,
          limit: filters.limit || 20,
          total: rawData.length, // La API no devuelve paginación
          totalPages: 1,
          hasMore: rawData.length >= (filters.limit || 20)
        }
      }
    }

    return {
      success: false,
      data: [],
      meta: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasMore: false
      }
    }
  },

  // Obtener detalle de un producto
  async getProduct(id: number): Promise<ApiResponse<Product>> {
    const response = await apiClient.get(`/products/${id}`)

    // La API puede devolver el producto directamente o en response.data
    const rawData = response.data?.data || response.data

    if (rawData) {
      // Normalizar imágenes: pueden venir como array de strings o array de objetos
      const images = (rawData.images || [])
        .filter((img: any) => {
          // Filtrar placeholders externos
          const url = typeof img === 'string' ? img : (img.url || img)
          return url && !url.includes('placeholder.com')
        })
        .map((img: any, index: number) => {
          if (typeof img === 'string') {
            return {
              id: index,
              url: img,
              thumbnail: img,
              position: index,
              is_main: index === 0
            }
          }
          return {
            id: img.id || index,
            url: img.url || img,
            thumbnail: img.thumbnail || img.url || img,
            position: img.position || index,
            is_main: img.is_main || index === 0
          }
        })

      // API puede devolver 'category' (singular) o 'categories' (array)
      const firstCategory = rawData.category || (rawData.categories && rawData.categories[0])

      const product: Product = {
        id: rawData.id,
        sku: rawData.sku,
        name: rawData.name,
        description: rawData.description || '',
        description_html: rawData.description_html || '',
        price: parseFloat(rawData.price || '0'),
        compare_price: rawData.compare_price ? parseFloat(rawData.compare_price) : undefined,
        cost: rawData.cost ? parseFloat(rawData.cost) : undefined,
        stock: rawData.stock || 0,
        min_stock: rawData.min_stock || undefined,
        weight: rawData.weight ? parseFloat(rawData.weight) : undefined,
        published: rawData.published || false,
        featured: rawData.featured || false,
        images,
        category: firstCategory ? {
          id: firstCategory.id,
          name: firstCategory.name,
          slug: firstCategory.slug || firstCategory.name?.toLowerCase() || '',
          parent_id: firstCategory.parent_id,
          image: firstCategory.image
        } : undefined,
        brand: rawData.brand ? {
          id: rawData.brand.id,
          name: rawData.brand.name,
          slug: rawData.brand.slug || rawData.brand.name.toLowerCase(),
          logo: rawData.brand.logo
        } : undefined,
        created_at: rawData.created_at || new Date().toISOString(),
        updated_at: rawData.updated_at || new Date().toISOString()
      }

      return {
        success: true,
        data: product
      }
    }

    return {
      success: false,
      data: null
    }
  },

  // Actualizar producto (edición rápida: precio, stock, publicado)
  async updateProduct(id: number, data: { price?: number; stock?: number; published?: boolean }): Promise<ApiResponse<Product>> {
    const payload: any = {}

    if (data.price !== undefined) payload.price = data.price
    if (data.stock !== undefined) payload.stock = data.stock
    if (data.published !== undefined) payload.published = data.published ? 1 : 0

    const response = await apiClient.put(`/products/${id}`, payload)

    // La API devuelve el producto actualizado
    const rawData = response.data?.data || response.data

    if (rawData) {
      // Reutilizar la misma normalización que getProduct
      const product: Product = {
        id: rawData.id,
        sku: rawData.sku,
        name: rawData.name,
        description: rawData.description || '',
        description_html: rawData.description_html || '',
        price: parseFloat(rawData.price || '0'),
        compare_price: rawData.compare_price ? parseFloat(rawData.compare_price) : undefined,
        cost: rawData.cost ? parseFloat(rawData.cost) : undefined,
        stock: rawData.stock || 0,
        min_stock: rawData.min_stock || undefined,
        weight: rawData.weight ? parseFloat(rawData.weight) : undefined,
        published: rawData.published || false,
        featured: rawData.featured || false,
        images: rawData.images || [],
        category: rawData.category,
        brand: rawData.brand,
        created_at: rawData.created_at || new Date().toISOString(),
        updated_at: rawData.updated_at || new Date().toISOString()
      }

      return {
        success: true,
        data: product
      }
    }

    return {
      success: false,
      data: null
    }
  },

  // Obtener estadísticas de productos
  async getStats(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/products/stats')
    return response.data
  },

  // Subir video de producto
  async uploadVideo(id: number, videoFile: File): Promise<ApiResponse<any>> {
    const formData = new FormData()
    formData.append('video', videoFile)

    const response = await apiClient.post(`/products/${id}/video`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    return response.data
  },

  // Eliminar video de producto
  async deleteVideo(id: number): Promise<ApiResponse<any>> {
    const response = await apiClient.delete(`/products/${id}/video`)
    return response.data
  }
}
