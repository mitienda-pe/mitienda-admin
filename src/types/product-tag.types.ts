export type TagType = 'texto' | 'imagen'
export type TagPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

export const MAX_TAGS_PER_PRODUCT = 8

export type TagLinkType = 'categoria' | 'marca' | 'gama' | 'lista' | 'promocion'

/** Ids de las categorías, marcas, gamas, listas y promociones cuyos productos
 *  llevan la etiqueta sin asignarla uno por uno. La pertenencia se resuelve al
 *  mostrar el catálogo: el producto que sale de la categoría pierde la etiqueta. */
export type ProductTagLinks = Record<TagLinkType, number[]>

export function emptyTagLinks(): ProductTagLinks {
  return { categoria: [], marca: [], gama: [], lista: [], promocion: [] }
}

export interface ProductTag {
  id: number
  nombre: string
  tipo: TagType
  texto?: string | null
  imagen_url?: string | null
  posicion: TagPosition
  color_fondo: string
  color_texto: string
  activo: boolean
  orden: number
  oculta_agotado?: boolean
  oculta_descuento?: boolean
  links?: ProductTagLinks
  created_at?: string
  updated_at?: string
}

export interface ProductTagAssignment {
  assignment_id: number
  producto_id: number
  tag: ProductTag
  prioridad: number
  fecha_inicio?: string | null
  fecha_fin?: string | null
  created_at?: string
}

export interface ProductTagFormData {
  nombre: string
  tipo: TagType
  texto?: string
  imagen_url?: string
  posicion: TagPosition
  color_fondo: string
  color_texto: string
  activo: boolean
  orden: number
  oculta_agotado: boolean
  oculta_descuento: boolean
  links: ProductTagLinks
}

export interface ProductTagAssignmentFormData {
  tag_id: number
  prioridad?: number
  fecha_inicio?: string | null
  fecha_fin?: string | null
}
