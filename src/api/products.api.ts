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

    // La API ahora devuelve { error, data, pagination }
    const apiResponse = response.data
    console.log('🔍 API Response:', apiResponse)

    // Manejar ambos formatos: nuevo (con pagination) y legacy (array directo)
    const rawData = apiResponse.data || apiResponse
    const paginationData = apiResponse.pagination
    console.log('🔍 Raw Data:', rawData)
    console.log('🔍 Pagination Data:', paginationData)

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
                cloudflare_url: img.cloudflare_url,
                cloudflare_id: img.cloudflare_id,
                cloudflare_imagen_id: img.cloudflare_imagen_id,  // NEW
                thumbnail: img.thumbnail || img.url || img,
                position: img.position || index,
                is_main: img.is_main || index === 0,
                source: img.source  // NEW: 'cloudflare' or 'legacy'
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
            unlimited_stock: product.unlimited_stock === 1 || product.unlimited_stock === true,
            published: product.published || false,
            featured: product.featured || false,
            images,
            category: product.category || null,
            brand: product.brand || null,
            created_at: product.created_at || new Date().toISOString(),
            updated_at: product.updated_at || new Date().toISOString()
          }
        }),
        meta: paginationData ? {
          page: paginationData.page,
          limit: paginationData.perPage || paginationData.limit || 20,
          total: paginationData.total,
          totalPages: paginationData.totalPages,
          hasMore: paginationData.hasMore
        } : {
          page: filters.page || 1,
          limit: filters.limit || 20,
          total: rawData.length,
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
            cloudflare_url: img.cloudflare_url,
            cloudflare_id: img.cloudflare_id,
            cloudflare_imagen_id: img.cloudflare_imagen_id,  // NEW
            thumbnail: img.thumbnail || img.url || img,
            position: img.position || index,
            is_main: img.is_main || index === 0,
            source: img.source  // NEW: 'cloudflare' or 'legacy'
          }
        })

      // Map categories array
      const categories = rawData.categories && Array.isArray(rawData.categories)
        ? rawData.categories.map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug || cat.name?.toLowerCase() || '',
            parent_id: cat.parent_id,
            image: cat.image
          }))
        : undefined

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
        unlimited_stock: rawData.unlimited_stock === 1 || rawData.unlimited_stock === true,
        min_stock: rawData.min_stock || undefined,
        weight: rawData.weight !== undefined && rawData.weight !== null ? parseFloat(rawData.weight.toString()) : undefined,
        weight_unit: rawData.weight_unit || undefined,
        height: rawData.height !== undefined && rawData.height !== null ? parseFloat(rawData.height.toString()) : undefined,
        width: rawData.width !== undefined && rawData.width !== null ? parseFloat(rawData.width.toString()) : undefined,
        length: rawData.length !== undefined && rawData.length !== null ? parseFloat(rawData.length.toString()) : undefined,
        dimensions_unit: rawData.dimensions_unit || undefined,
        volumetric_weight: rawData.volumetric_weight !== undefined && rawData.volumetric_weight !== null ? parseFloat(rawData.volumetric_weight.toString()) : undefined,
        published: rawData.published || false,
        featured: rawData.featured || false,
        images,
        video: rawData.video ? {
          cloudflare_uid: rawData.video.cloudflare_uid || null,
          stream_url: rawData.video.stream_url || null,
          thumbnail_url: rawData.video.thumbnail_url || null,
          duration: rawData.video.duration ? parseFloat(rawData.video.duration) : null,
          width: rawData.video.width ? parseInt(rawData.video.width) : null,
          height: rawData.video.height ? parseInt(rawData.video.height) : null,
          aspect_ratio: rawData.video.aspect_ratio ? parseFloat(rawData.video.aspect_ratio) : null,
          status: rawData.video.status || null,
          error: rawData.video.error || null,
          created_at: rawData.video.created_at || null
        } : null,
        documents: rawData.documents || [],
        categories: categories,
        brand: rawData.brand ? {
          id: rawData.brand.id,
          name: rawData.brand.name,
          slug: rawData.brand.slug || rawData.brand.name.toLowerCase(),
          logo: rawData.brand.logo
        } : undefined,
        seo: rawData.seo ? {
          meta_title: rawData.seo.meta_title || undefined,
          meta_description: rawData.seo.meta_description || undefined,
          meta_image: rawData.seo.meta_image || undefined,
          slug: rawData.seo.slug || undefined
        } : undefined,
        external_categories: rawData.external_categories ? {
          facebook: rawData.external_categories.facebook || undefined,
          google: rawData.external_categories.google || undefined,
          mercadolibre: rawData.external_categories.mercadolibre || undefined
        } : undefined,
        order: rawData.order !== undefined && rawData.order !== null ? parseInt(rawData.order.toString()) : undefined,
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
      data: undefined
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
        unlimited_stock: rawData.unlimited_stock === 1 || rawData.unlimited_stock === true,
        min_stock: rawData.min_stock || undefined,
        weight: rawData.weight ? parseFloat(rawData.weight) : undefined,
        published: rawData.published || false,
        featured: rawData.featured || false,
        images: rawData.images || [],
        categories: rawData.categories,
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
      data: undefined
    }
  },

  // Obtener estadísticas de productos
  async getStats(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/products/stats')
    return response.data
  },

  // Obtener link de upload directo a Cloudflare
  async getVideoUploadLink(id: number): Promise<ApiResponse<any>> {
    const response = await apiClient.post(`/products/${id}/video/upload-link`)
    return response.data
  },

  // Confirmar video subido (valida duración)
  async confirmVideoUpload(id: number): Promise<ApiResponse<any>> {
    const response = await apiClient.post(`/products/${id}/video/confirm`)
    return response.data
  },

  // Subir video de producto (método antiguo - deprecado)
  async uploadVideo(id: number, videoFile: File): Promise<ApiResponse<any>> {
    const formData = new FormData()
    formData.append('video', videoFile)

    const response = await apiClient.post(`/products/${id}/video`, formData)

    return response.data
  },

  // Eliminar video de producto
  async deleteVideo(id: number): Promise<ApiResponse<any>> {
    const response = await apiClient.delete(`/products/${id}/video`)
    return response.data
  },

  // Obtener documentos de un producto
  async getDocuments(id: number): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/products/${id}/documents`)
    return response.data
  },

  // Subir documento PDF
  async uploadDocument(id: number, file: File, name?: string): Promise<ApiResponse<any>> {
    const formData = new FormData()
    formData.append('document', file)
    if (name) {
      formData.append('nombre', name)
    }

    const response = await apiClient.post(`/products/${id}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    return response.data
  },

  // Eliminar documento
  async deleteDocument(productId: number, documentId: number): Promise<ApiResponse<any>> {
    const response = await apiClient.delete(`/products/${productId}/documents/${documentId}`)
    return response.data
  },

  // Subir imagen de producto
  async uploadImage(id: number, imageFile: File): Promise<ApiResponse<any>> {
    const formData = new FormData()
    formData.append('image', imageFile)

    const response = await apiClient.post(`/products/${id}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    return response.data
  },

  // Eliminar imagen de producto
  async deleteImage(productId: number, imageId: number): Promise<ApiResponse<any>> {
    const response = await apiClient.delete(`/products/${productId}/images/${imageId}`)
    return response.data
  }
}
