export interface SectionColumn {
  posicion: number
  colBotstrap: number // 12=1col, 6=2cols, 4=3cols, 3=4cols
  componente_id: number | string // 0 = empty
}

export interface PageSection {
  ubicacion: 'header' | 'footer'
  columnas: SectionColumn[]
}

export interface PageLayout {
  header: SectionColumn[][]
  footer: SectionColumn[][]
}

export interface PageDefinition {
  id: number
  label: string
  zones: ('header' | 'footer')[]
}

export const PAGE_DEFINITIONS: PageDefinition[] = [
  { id: 1, label: 'Home', zones: ['header'] },
  { id: 2, label: 'Catálogo', zones: ['header', 'footer'] },
  { id: 3, label: 'Detalle Producto', zones: ['header', 'footer'] },
  { id: 4, label: 'Carrito', zones: ['header', 'footer'] },
  { id: 5, label: 'Checkout', zones: ['header', 'footer'] },
  { id: 6, label: 'Pago Confirmado', zones: ['header', 'footer'] },
]

export const COLUMN_LAYOUTS = [
  { cols: 1, label: '1 columna', colBs: 12 },
  { cols: 2, label: '2 columnas', colBs: 6 },
  { cols: 3, label: '3 columnas', colBs: 4 },
  { cols: 4, label: '4 columnas', colBs: 3 },
]

export const ZONE_LABELS: Record<'header' | 'footer', string> = {
  header: 'Arriba del contenido',
  footer: 'Abajo del contenido',
}
