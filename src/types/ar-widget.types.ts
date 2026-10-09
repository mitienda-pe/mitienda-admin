/**
 * Módulo Grymala AR: qué productos tienen visor 3D/AR, con qué medidas y fotos.
 *
 * Las medidas van siempre en centímetros y son PROPIAS del módulo: las de
 * `productos` miden la caja de envío y no son confiables (hay sillas cargadas
 * como 0,72 de alto con la unidad diciendo "centímetros"). Desde la v2 del
 * widget esos números se dibujan sobre el modelo, así que un error se ve.
 */
export interface ArWidget {
  id: number
  producto_id: number
  producto_titulo: string | null
  producto_slug: string | null
  external_id: string
  status: number
  kind: ArWidgetKind
  width_cm: number | null
  height_cm: number | null
  depth_cm: number | null
  show_dimensions: number
  sort_order: number
  /** Cuántos modelos del plan consumió este producto. */
  rebuild_count: number
  /** Referencias `fuente:id` de las fotos elegidas, en orden. */
  images: string[]
  updated_at?: string | null
}

/** Únicas categorías que acepta el proveedor. */
export type ArWidgetKind = 'chair' | 'sofa' | 'lamp' | 'table' | 'other'

export const AR_WIDGET_KINDS: { value: ArWidgetKind; label: string }[] = [
  { value: 'chair', label: 'Silla' },
  { value: 'sofa', label: 'Sofá' },
  { value: 'lamp', label: 'Lámpara' },
  { value: 'table', label: 'Mesa' },
  { value: 'other', label: 'Otro' }
]

/** Tope del proveedor. Más fotos no viajan. */
export const AR_WIDGET_MAX_IMAGES = 6

/**
 * Foto de la galería del producto. `ref` lleva la fuente pegada (`r2:123`,
 * `legacy:456`) porque los dos espacios de id colisionan: una misma foto puede
 * ser legacy 934011 y r2 359157 a la vez.
 */
export interface ArWidgetImageOption {
  ref: string
  orden: number
  url: string
}

/** Producto candidato: todavía sin visor y con al menos una foto. */
export interface ArWidgetProductOption {
  producto_id: number
  producto_titulo: string
  producto_titulourl: string
  producto_sku: string | null
  producto_altura: string | null
  producto_ancho: string | null
  producto_largo: string | null
  producto_undlongitud: string | null
}

export interface ArWidgetFormData {
  producto_id: number | null
  status: number
  kind: ArWidgetKind
  width_cm: number | null
  height_cm: number | null
  depth_cm: number | null
  show_dimensions: number
  images: string[]
}
