export type BarPosition = 'top' | 'bottom'

export interface AnnouncementBar {
  id: number
  tienda_id: number
  bar_nombre: string
  bar_texto: string
  bar_posicion: BarPosition
  bar_bg_color: string
  bar_text_color: string
  bar_boton_texto: string | null
  bar_boton_url: string | null
  bar_boton_bg_color: string | null
  bar_boton_text_color: string | null
  bar_closeable: boolean
  fecha_inicio: string | null
  fecha_fin: string | null
  activo: boolean
  created_at: string
  updated_at: string
}

export interface AnnouncementBarFormData {
  bar_nombre: string
  bar_texto: string
  bar_posicion: BarPosition
  bar_bg_color: string
  bar_text_color: string
  bar_boton_texto?: string | null
  bar_boton_url?: string | null
  bar_boton_bg_color?: string | null
  bar_boton_text_color?: string | null
  bar_closeable: boolean
  fecha_inicio?: string | null
  fecha_fin?: string | null
  activo: boolean
}

export const BAR_POSITIONS: { value: BarPosition; label: string }[] = [
  { value: 'top', label: 'Superior' },
  { value: 'bottom', label: 'Inferior' }
]
