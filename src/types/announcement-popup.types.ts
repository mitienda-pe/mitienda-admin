export type PopupSize = 'sm' | 'md'
export type PopupPosition = 'center' | 'bottom-right' | 'bottom-left'
export type PopupTrigger = 'delay' | 'scroll' | 'exit'
export type PopupDevice = 'all' | 'mobile' | 'desktop'
export type PopupFrequency = 'always' | 'session' | 'days' | 'once'
export type PopupPage = 'home' | 'product' | 'catalog' | 'cart' | 'content' | 'other'

export interface AnnouncementPopup {
  id: number
  tienda_id: number
  popup_nombre: string
  popup_titulo: string | null
  popup_texto: string | null
  popup_imagen_url: string | null
  popup_tamano: PopupSize
  popup_posicion: PopupPosition
  popup_bg_color: string
  popup_text_color: string
  popup_boton_texto: string | null
  popup_boton_url: string | null
  popup_boton_bg_color: string | null
  popup_boton_text_color: string | null
  disparador: PopupTrigger
  disparador_valor: number
  /** null = todas las páginas */
  paginas: PopupPage[] | null
  dispositivo: PopupDevice
  frecuencia: PopupFrequency
  frecuencia_dias: number | null
  fecha_inicio: string | null
  fecha_fin: string | null
  activo: boolean
  created_at: string
  updated_at: string
}

export type AnnouncementPopupPayload = Omit<AnnouncementPopup, 'id' | 'tienda_id' | 'created_at' | 'updated_at'>

export const POPUP_SIZES: { value: PopupSize; label: string }[] = [
  { value: 'sm', label: 'Chico' },
  { value: 'md', label: 'Mediano' }
]

export const POPUP_POSITIONS: { value: PopupPosition; label: string }[] = [
  { value: 'center', label: 'Centro' },
  { value: 'bottom-left', label: 'Esquina izquierda' },
  { value: 'bottom-right', label: 'Esquina derecha' }
]

export const POPUP_TRIGGERS: { value: PopupTrigger; label: string; hint: string }[] = [
  { value: 'delay', label: 'Al cargar la página', hint: 'Aparece tras unos segundos.' },
  { value: 'scroll', label: 'Al hacer scroll', hint: 'Aparece cuando el visitante baja cierto porcentaje de la página.' },
  { value: 'exit', label: 'Al intentar salir', hint: 'Aparece cuando el cursor va a cerrar la pestaña. Solo en computadoras.' }
]

export const POPUP_DEVICES: { value: PopupDevice; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'mobile', label: 'Solo móvil' },
  { value: 'desktop', label: 'Solo computadora' }
]

export const POPUP_FREQUENCIES: { value: PopupFrequency; label: string }[] = [
  { value: 'session', label: 'Una vez por visita' },
  { value: 'days', label: 'Una vez cada ciertos días' },
  { value: 'once', label: 'Una sola vez' },
  { value: 'always', label: 'En cada página' }
]

export const POPUP_PAGES: { value: PopupPage; label: string }[] = [
  { value: 'home', label: 'Inicio' },
  { value: 'product', label: 'Ficha de producto' },
  { value: 'catalog', label: 'Categorías, marcas, listas y búsqueda' },
  { value: 'cart', label: 'Carrito' },
  { value: 'content', label: 'Páginas y blog' },
  { value: 'other', label: 'Resto (cuenta, contacto, etc.)' }
]
