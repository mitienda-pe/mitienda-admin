// Tipos de atributos de tienda

export type AttributeType = 1 | 2 | 3 | 4
// 1 = Texto/Combo, 2 = Color Hex, 3 = Botón, 4 = Imagen

export type AttributeStyle = 1 | 2
// 1 = Rectangular, 2 = Circular

export interface AttributeOption {
  id: number
  text: string
  global_attribute_id: number
}

export interface StoreAttribute {
  id: number
  name: string
  slug: string
  type: AttributeType
  style: AttributeStyle
  option_count: number
  options?: AttributeOption[]
  created_at?: string
  updated_at?: string
}

export interface CreateAttributePayload {
  name: string
  type: AttributeType
  style: AttributeStyle
  options?: string[]
}

export interface UpdateAttributePayload {
  name?: string
  type?: AttributeType
  style?: AttributeStyle
}

export const ATTRIBUTE_TYPE_LABELS: Record<AttributeType, string> = {
  1: 'Texto',
  2: 'Color',
  3: 'Botón',
  4: 'Imagen',
}

export const ATTRIBUTE_STYLE_LABELS: Record<AttributeStyle, string> = {
  1: 'Rectangular',
  2: 'Circular',
}
