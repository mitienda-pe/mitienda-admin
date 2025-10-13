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
}

export interface ProductTagAssignmentFormData {
  tag_id: number
  prioridad?: number
  fecha_inicio?: string | null
  fecha_fin?: string | null
}
