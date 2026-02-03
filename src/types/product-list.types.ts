export interface ProductList {
  productolista_id: number
  tienda_id: number
  productolista_nombre: string
  productolista_codigo: string
  productolista_estado: number
  productolista_tipo: number // 1=Manual, 2=Más Vendidos, 3=Nuevos Productos
  productolista_cantidaditems: number | null
  productolista_jsonconfiguracion?: string | null
  productolista_fechacreacion?: string
  productolista_fechamodificacion?: string
  product_count?: number
}

export interface ProductListFormData {
  productolista_nombre: string
  productolista_tipo: number
  productolista_estado: number
  productolista_cantidaditems: number | null
}

export interface ProductListCreateRequest {
  productolista_nombre: string
  productolista_tipo: number
  productolista_estado?: number
  productolista_cantidaditems?: number | null
}

export interface ProductListUpdateRequest {
  productolista_nombre?: string
  productolista_tipo?: number
  productolista_estado?: number
  productolista_cantidaditems?: number | null
}

export const PRODUCT_LIST_TYPES: Record<number, string> = {
  1: 'Manual',
  2: 'Más Vendidos',
  3: 'Nuevos Productos'
}
