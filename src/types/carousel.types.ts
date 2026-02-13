export interface CarouselSlide {
  tiendaimagen_id: number
  tiendacarrusel_id: number
  tiendacarruselimagen_titulo: string | null
  tiendacarruselimagen_enlace: string | null
  tiendacarruselimagen_desktop_r2_url: string | null
  tiendacarruselimagen_mobile_r2_url: string | null
  tiendacarruselimagen_desktop_aspect: DesktopAspectRatio | null
  tiendacarruselimagen_mobile_aspect: MobileAspectRatio | null
  tiendacarruselimagen_orden: number
}

export type DesktopAspectRatio = '16:9' | '21:9'
export type MobileAspectRatio = '4:5' | '1:1'

export interface CarouselSlideFormData {
  alt_text?: string
  enlace?: string
}

export interface AspectRatioPreset {
  value: string
  label: string
  width: number
  height: number
  ratio: number
}

export const DESKTOP_PRESETS: AspectRatioPreset[] = [
  { value: '16:9', label: '16:9 — Hero inmersivo', width: 1920, height: 1080, ratio: 16 / 9 },
  { value: '21:9', label: '21:9 — Ultra-wide', width: 1920, height: 823, ratio: 21 / 9 }
]

export const MOBILE_PRESETS: AspectRatioPreset[] = [
  { value: '4:5', label: '4:5 — Vertical', width: 1080, height: 1350, ratio: 4 / 5 },
  { value: '1:1', label: '1:1 — Cuadrado', width: 1080, height: 1080, ratio: 1 }
]

export const MAX_SLIDES = 6
