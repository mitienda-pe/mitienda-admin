export interface ProductList {
  productolista_id: number
  tienda_id: number
  productolista_nombre: string
  productolista_slug: string | null
  productolista_codigo: string
  productolista_estado: number
  productolista_tipo: number // 1=Manual, 2=Más Vendidos, 3=Nuevos Productos, 4=De una promoción
  productolista_cantidaditems: number | null
  productolista_jsonconfiguracion?: string | null
  /** Tipo 4: promoción V2 cuyos productos llenan la lista (la API lo saca del JSON). */
  promotion_id?: number | null
  // Contenido de la lista. La descripción es HTML del editor; el storefront la
  // pinta en la cabecera. `_meta_tittle` conserva el typo de marcas y
  // categorías: las tres comparten el nombre de columna.
  productolista_descripcion?: string | null
  productolista_meta_tittle?: string | null
  productolista_meta_description?: string | null
  square_r2_url?: string | null
  cover_r2_url?: string | null
  og_r2_url?: string | null
  productolista_fechacreacion?: string
  productolista_fechamodificacion?: string
  product_count?: number
}

export interface ProductListFormData {
  productolista_nombre: string
  productolista_slug: string
  productolista_tipo: number
  promotion_id: number | null
  productolista_estado: number
  productolista_cantidaditems: number | null
  productolista_descripcion: string
  productolista_meta_tittle: string
  productolista_meta_description: string
}

export interface ProductListCreateRequest {
  productolista_nombre: string
  productolista_slug?: string
  productolista_tipo: number
  promotion_id?: number | null
  productolista_estado?: number
  productolista_cantidaditems?: number | null
  productolista_descripcion?: string | null
  productolista_meta_tittle?: string | null
  productolista_meta_description?: string | null
}

export interface ProductListUpdateRequest {
  productolista_nombre?: string
  productolista_slug?: string
  productolista_tipo?: number
  promotion_id?: number | null
  productolista_estado?: number
  productolista_cantidaditems?: number | null
  productolista_descripcion?: string | null
  productolista_meta_tittle?: string | null
  productolista_meta_description?: string | null
}

export const PRODUCT_LIST_TYPES: Record<number, string> = {
  1: 'Manual',
  2: 'Más Vendidos',
  3: 'Nuevos Productos',
  4: 'De una promoción'
}

export const PROMOTION_LIST_TYPE = 4

/** Promoción elegible para una lista tipo 4: rebaja productos (no el carrito ni el envío). */
export interface PromotionListOption {
  id: number
  name: string
  status: string
  starts_at: string | null
  ends_at: string | null
  activation_types: string[]
  product_count: number
}
