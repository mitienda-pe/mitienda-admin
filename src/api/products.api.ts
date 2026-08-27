import apiClient from './axios'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type {
  Product,
  ProductUpdatePayload,
  ExternalCategoryOption,
  VariantsData,
  GenerateVariantsPayload,
  SaveVariantsPayload,
  ProductLot,
  ProductLotCreate,
  ProductLotMovement,
  WholesalePriceTier,
  ProductImage,
} from '@/types/product.types'

export interface RelatedProductItem {
  id: number
  sku: string | null
  name: string
  published: boolean
}

export interface RelatedProductsPayload {
  max: number
  items: RelatedProductItem[]
}

export interface ProductsFilters {
  page?: number
  limit?: number
  search?: string
  category_id?: number | null
  brand_id?: number | null
  product_type_id?: number | null
  published?: boolean | null
  stock_status?: 'all' | 'in_stock' | 'limited' | 'out_of_stock'
  /** Resuelve productos puntuales por ID, sin paginar el catálogo entero. */
  ids?: number[]
}

/**
 * Normaliza las imagenes que devuelve el API: pueden venir como array de
 * strings (URLs) o de objetos, y el front siempre espera objetos con
 * `thumbnail` y una imagen principal.
 */
export function normalizeProductImages(rawImages: any): ProductImage[] {
  return (rawImages || [])
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
          is_main: index === 0,
        }
      }
      return {
        id: img.id || index,
        url: img.url || img,
        cloudflare_url: img.cloudflare_url,
        cloudflare_id: img.cloudflare_id,
        cloudflare_imagen_id: img.cloudflare_imagen_id,
        r2_imagen_id: img.r2_imagen_id,
        r2_url: img.r2_url,
        thumbnail: img.thumbnail || img.url || img,
        position: img.position || index,
        is_main: img.is_main || index === 0,
        source: img.source,
      }
    })
}

// El API manda numeros como string ("12.50") y ausencias como null o "".
const toFloat = (value: any): number | undefined =>
  value === undefined || value === null || value === '' ? undefined : parseFloat(value.toString())

const toInt = (value: any): number | undefined =>
  value === undefined || value === null || value === '' ? undefined : parseInt(value.toString())

// PHP serializa los flags como booleano o como 1/0 segun el endpoint.
const toBool = (value: any): boolean => value === true || value === 1 || value === '1'

/**
 * Normaliza el producto que devuelve la ficha (`GET /products/{id}` y la
 * respuesta del `PUT`, que reusa el mismo transformador del backend).
 *
 * Parte de un spread de la respuesta a proposito: antes esto se armaba campo
 * por campo y cualquier dato que nadie hubiera listado a mano se perdia en
 * silencio aunque el API lo enviara -- paso con `barcode` (el campo salia
 * vacio en la ficha), con `max_purchase_qty` (volvia a 0 al refrescar) y con
 * `has_variation_attributes`. Debajo del spread solo quedan los campos que
 * necesitan conversion, valor por defecto o una forma distinta.
 */
export function normalizeProduct(rawData: any): Product {
  return {
    ...rawData,
    // El listado usa `productotipo_id`; la ficha, `product_type_id`.
    product_type_id: rawData.product_type_id ?? rawData.productotipo_id ?? undefined,
    product_type: rawData.product_type ?? null,
    description: rawData.description || '',
    description_html: rawData.description_html || '',
    description_short: rawData.description_short || '',
    price: toFloat(rawData.price) ?? 0,
    price_without_tax: toFloat(rawData.price_without_tax),
    compare_price: rawData.compare_price ? toFloat(rawData.compare_price) : undefined,
    cost: rawData.cost ? toFloat(rawData.cost) : undefined,
    igv_percent: rawData.igv_percent !== undefined ? toInt(rawData.igv_percent) : 18,
    tax_affectation: rawData.tax_affectation !== undefined ? toInt(rawData.tax_affectation) : 1,
    // Bolsa plastica afecta a ICBPER (Ley 30884)
    icbper: toBool(rawData.icbper),
    // Indica si el producto usa variantes (precio/stock por variante): de el
    // dependen el editor de variantes y el ocultado del precio/stock general.
    has_variation_attributes: toBool(rawData.has_variation_attributes),
    stock: rawData.stock || 0,
    unlimited_stock: toBool(rawData.unlimited_stock),
    // Tope de unidades por compra (0 = sin tope).
    max_purchase_qty: rawData.max_purchase_qty ?? 0,
    sold_by_weight: toBool(rawData.sold_by_weight),
    min_stock: rawData.min_stock || undefined,
    weight: toFloat(rawData.weight),
    weight_unit: rawData.weight_unit || undefined,
    height: toFloat(rawData.height),
    width: toFloat(rawData.width),
    length: toFloat(rawData.length),
    dimensions_unit: rawData.dimensions_unit || undefined,
    volumetric_weight: toFloat(rawData.volumetric_weight),
    published: rawData.published || false,
    // Visibilidad en el POS: solo es false si el API lo dice explicitamente.
    published_pos: rawData.published_pos !== false,
    featured: rawData.featured || false,
    images: normalizeProductImages(rawData.images),
    video: rawData.video
      ? {
          cloudflare_uid: rawData.video.cloudflare_uid || null,
          stream_url: rawData.video.stream_url || null,
          thumbnail_url: rawData.video.thumbnail_url || null,
          duration: toFloat(rawData.video.duration) ?? null,
          width: toInt(rawData.video.width) ?? null,
          height: toInt(rawData.video.height) ?? null,
          aspect_ratio: toFloat(rawData.video.aspect_ratio) ?? null,
          status: rawData.video.status || null,
          error: rawData.video.error || null,
          created_at: rawData.video.created_at || null,
        }
      : null,
    documents: rawData.documents || [],
    categories: Array.isArray(rawData.categories)
      ? rawData.categories.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug || cat.name?.toLowerCase() || '',
          parent_id: cat.parent_id,
          image: cat.image,
        }))
      : undefined,
    brand: rawData.brand
      ? {
          id: rawData.brand.id,
          name: rawData.brand.name,
          slug: rawData.brand.slug || rawData.brand.name?.toLowerCase() || '',
          logo: rawData.brand.logo,
        }
      : undefined,
    seo: rawData.seo
      ? {
          meta_title: rawData.seo.meta_title || undefined,
          meta_description: rawData.seo.meta_description || undefined,
          meta_image: rawData.seo.meta_image || undefined,
          slug: rawData.seo.slug || undefined,
        }
      : undefined,
    external_categories: rawData.external_categories
      ? {
          facebook: rawData.external_categories.facebook || undefined,
          google: rawData.external_categories.google || undefined,
          mercadolibre: rawData.external_categories.mercadolibre || undefined,
        }
      : undefined,
    order: toInt(rawData.order),
    created_at: rawData.created_at || new Date().toISOString(),
    updated_at: rawData.updated_at || new Date().toISOString(),
  }
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
    if (filters.product_type_id) params.append('product_type_id', filters.product_type_id.toString())
    if (filters.ids?.length) params.append('ids', filters.ids.join(','))
    if (filters.published !== null && filters.published !== undefined) {
      params.append('published', filters.published ? '1' : '0')
    }
    if (filters.stock_status && filters.stock_status !== 'all') {
      params.append('stock_status', filters.stock_status)
    }

    const response = await apiClient.get(`/products?${params.toString()}`)

    // La API ahora devuelve { error, data, pagination }
    const apiResponse = response.data

    // Manejar ambos formatos: nuevo (con pagination) y legacy (array directo)
    const rawData = apiResponse.data || apiResponse
    const paginationData = apiResponse.pagination

    if (Array.isArray(rawData)) {
      return {
        success: true,
        data: rawData.map((product: any) => ({
          // Spread primero: el listado tambien se armaba campo por campo y
          // descartaba en silencio lo que nadie hubiera listado (barcode,
          // tax_affectation...). Debajo solo lo que necesita conversion o una
          // forma propia del listado.
          ...product,
          product_type_id: product.product_type_id ?? product.productotipo_id ?? undefined,
          product_type: product.product_type ?? null,
          description: product.description || '',
          description_html: product.description_html || '',
          price: toFloat(product.price) ?? 0,
          price_without_tax: toFloat(product.price_without_tax),
          // `price` viene con la promocion ya aplicada; sin estos dos campos la
          // tarjeta mostraba el precio rebajado como si fuera el de lista y no
          // cuadraba con el detalle (que muestra el precio sin promocion).
          original_price: toFloat(product.original_price),
          promotion: product.promotion
            ? {
                id: product.promotion.id,
                name: product.promotion.name,
                type: product.promotion.type,
                value: product.promotion.value,
                percentage: toFloat(product.promotion.percentage),
                amount: toFloat(product.promotion.amount),
              }
            : null,
          stock: product.stock || 0,
          unlimited_stock: toBool(product.unlimited_stock),
          max_purchase_qty: product.max_purchase_qty ?? 0,
          // El listado devuelve `has_variants` y la ficha `has_variation_attributes`:
          // leer solo uno dejaba el flag SIEMPRE en false para los productos que
          // vienen de una busqueda, y con el los filtros que dependen de saber si
          // el producto tiene variantes.
          has_variation_attributes:
            product.has_variation_attributes === true || product.has_variants === true,
          published: product.published || false,
          published_pos: product.published_pos !== false,
          featured: product.featured || false,
          images: normalizeProductImages(product.images),
          category: product.category || null,
          brand: product.brand || null,
          created_at: product.created_at || new Date().toISOString(),
          updated_at: product.updated_at || new Date().toISOString(),
        })),
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
      return {
        success: true,
        data: normalizeProduct(rawData),
      }
    }

    return {
      success: false,
      data: undefined
    }
  },

  // Actualizar producto (soporta update parcial o completo)
  async updateProduct(id: number, data: ProductUpdatePayload & Record<string, any>): Promise<ApiResponse<Product>> {
    const payload: Record<string, any> = {}

    // Map all defined fields to payload
    const directFields = [
      'name', 'sku', 'barcode', 'price', 'price_without_tax', 'cost', 'stock',
      'max_purchase_qty',
      'description', 'description_html', 'description_short',
      'brand_id', 'gamma_id', 'order', 'igv_percent', 'tax_affectation',
      'meta_title', 'meta_description', 'meta_image', 'slug',
      'height', 'width', 'length', 'dimensions_unit', 'weight', 'weight_unit',
      'facebook_category_id', 'google_category_id',
      'shipping_conversion_factor', 'product_type_id'
    ] as const
    for (const key of directFields) {
      if ((data as any)[key] !== undefined) payload[key] = (data as any)[key]
    }

    // Boolean fields: convert to 0/1
    if (data.published !== undefined) payload.published = data.published ? 1 : 0
    // Publicación por canal: `published` es la tienda virtual, `published_pos` el
    // catálogo del punto de venta. Solo se envía si el formulario lo tocó, para no
    // pisar el valor que gestiona el POS.
    if (data.published_pos !== undefined) payload.published_pos = data.published_pos ? 1 : 0
    if (data.featured !== undefined) payload.featured = data.featured ? 1 : 0
    if (data.unlimited_stock !== undefined) payload.unlimited_stock = data.unlimited_stock ? 1 : 0
    if (data.shipping_per_unit !== undefined) payload.shipping_per_unit = data.shipping_per_unit ? 1 : 0
    if (data.sold_by_weight !== undefined) payload.sold_by_weight = data.sold_by_weight ? 1 : 0
    // Control por lotes: el backend lee `lots_managed` y setea producto_sw_lotes.
    if (data.lots_managed !== undefined) payload.lots_managed = data.lots_managed ? 1 : 0
    // ICBPER (Ley 30884): bolsa plástica. El backend responde 422 si la tienda
    // emite por NetSuite o por el POS legacy, que aún no declaran el tributo.
    if (data.icbper !== undefined) payload.icbper = data.icbper ? 1 : 0

    // Array fields
    if (data.categories !== undefined) payload.categories = data.categories

    const response = await apiClient.put(`/products/${id}`, payload)

    // La API devuelve el producto actualizado con el mismo transformador que
    // la ficha, asi que se normaliza igual.
    const rawData = response.data?.data || response.data

    if (rawData) {
      return {
        success: true,
        data: normalizeProduct(rawData),
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

  // Reindexar el catálogo completo en el buscador (Meilisearch)
  async reindex(): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/products/reindex')
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

  // Productos relacionados manuales del PDP ("También te puede interesar").
  // Tener vínculos acá anula la configuración automática de la tienda.
  async getRelated(id: number): Promise<ApiResponse<RelatedProductsPayload>> {
    const response = await apiClient.get(`/products/${id}/related`)
    return response.data
  },

  // Reemplaza el set completo; el orden del arreglo es el orden final y un
  // arreglo vacío devuelve el producto al modo automático.
  async saveRelated(id: number, productIds: number[]): Promise<ApiResponse<RelatedProductsPayload>> {
    const response = await apiClient.put(`/products/${id}/related`, { product_ids: productIds })
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
  },

  // Reordenar imágenes de producto (acepta mezcla de sources r2/cloudflare/legacy)
  async reorderImages(
    productId: number,
    images: Array<{ id: number; source: 'r2' | 'cloudflare' | 'legacy' }>
  ): Promise<ApiResponse<any>> {
    const response = await apiClient.put(`/products/${productId}/images/reorder`, { images })
    return response.data
  },

  // Subir imagen OpenGraph
  async uploadOgImage(id: number, imageFile: File): Promise<ApiResponse<{ meta_image: string }>> {
    const formData = new FormData()
    formData.append('image', imageFile)
    const response = await apiClient.post(`/products/${id}/og-image`, formData)
    return response.data
  },

  // Eliminar imagen OpenGraph
  async deleteOgImage(id: number): Promise<ApiResponse<any>> {
    const response = await apiClient.delete(`/products/${id}/og-image`)
    return response.data
  },

  // Listar categorías externas (Facebook/Google) con navegación jerárquica
  async getExternalCategories(
    platform: 'facebook' | 'google',
    parentId: number = 0
  ): Promise<ApiResponse<ExternalCategoryOption[]>> {
    const response = await apiClient.get(`/external-categories/${platform}`, {
      params: { parent_id: parentId }
    })
    return response.data
  },

  // ── Product Variants ──

  // Obtener variantes de un producto con detalle de atributos
  async getVariants(productId: number): Promise<ApiResponse<VariantsData>> {
    const response = await apiClient.get(`/products/${productId}/variants`)
    return response.data
  },

  // Obtener atributos de la tienda para el editor de variantes
  async getProductAttributes(productId: number): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get(`/products/${productId}/attributes`)
    return response.data
  },

  // Generar combinaciones (preview, no guarda)
  async generateVariants(
    productId: number,
    payload: GenerateVariantsPayload
  ): Promise<ApiResponse<VariantsData & { count: number }>> {
    const response = await apiClient.post(
      `/products/${productId}/variants/generate`,
      payload
    )
    return response.data
  },

  // Guardar variantes (bulk upsert + delete)
  async saveVariants(
    productId: number,
    payload: SaveVariantsPayload
  ): Promise<ApiResponse<{ count: number }>> {
    const response = await apiClient.put(`/products/${productId}/variants`, payload)
    return response.data
  },

  // Eliminar una variante individual
  async deleteVariant(productId: number, variantId: number): Promise<ApiResponse<void>> {
    const response = await apiClient.delete(`/products/${productId}/variants/${variantId}`)
    return response.data
  },

  // Eliminar producto (soft delete: el backend pone producto_status = 0)
  async deleteProduct(id: number): Promise<ApiResponse<void>> {
    const response = await apiClient.delete(`/products/${id}`)
    return {
      success: response.data?.success ?? (response.status >= 200 && response.status < 300),
      message: response.data?.message,
    }
  },

  // ─── Lotes con vencimiento (perecibles) ────────────────────────
  async getLots(productId: number, variantId?: number): Promise<ApiResponse<{ items: ProductLot[] }>> {
    const qs = variantId ? `?productoatributo_id=${variantId}` : ''
    const response = await apiClient.get(`/products/${productId}/lots${qs}`)
    return response.data
  },

  async createLot(productId: number, payload: ProductLotCreate): Promise<ApiResponse<{ lote_id: number }>> {
    const response = await apiClient.post(`/products/${productId}/lots`, payload)
    return response.data
  },

  async bajaLot(loteId: number, motivo?: string): Promise<ApiResponse<{ lote_id: number }>> {
    const response = await apiClient.post(`/lots/${loteId}/baja`, motivo ? { motivo } : {})
    return response.data
  },

  async getLotKardex(
    productId: number,
    params: { lote_id?: number; page?: number } = {}
  ): Promise<ApiResponse<{ items: ProductLotMovement[]; pagination: unknown }>> {
    const qs = new URLSearchParams()
    if (params.lote_id) qs.append('lote_id', String(params.lote_id))
    if (params.page) qs.append('page', String(params.page))
    const response = await apiClient.get(`/products/${productId}/lots/kardex?${qs.toString()}`)
    return response.data
  },

  // ─── Precios por mayor (descuentos por volumen) ────────────────
  // Gated a mod_listaprecioxmayor (plan Large). El PUT reemplaza el set
  // completo de tramos del producto: mandar `tiers: []` los borra todos.
  async getWholesalePrices(productId: number): Promise<ApiResponse<WholesalePriceTier[]>> {
    const response = await apiClient.get(`/products/${productId}/wholesale-prices`)
    return response.data
  },

  async saveWholesalePrices(
    productId: number,
    tiers: WholesalePriceTier[]
  ): Promise<ApiResponse<WholesalePriceTier[]>> {
    const response = await apiClient.put(`/products/${productId}/wholesale-prices`, { tiers })
    return response.data
  },
}
