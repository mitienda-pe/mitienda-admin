export interface BlockConfig {
  titulo?: string
  bg_color?: string
  limite?: number
  items?: number[]
}

export interface SectionColumn {
  posicion: number
  colBotstrap: number // 12=1col, 6=2cols, 4=3cols, 3=4cols
  componente_id: number | string // 0 = empty user component
  bloque_codigo?: string // predefined system block (mutually exclusive with componente_id)
  config?: BlockConfig
}

export type ItemsType = 'categorias' | 'marcas' | 'productos' | 'listas' | 'combos' | 'gamas'

export interface PredefinedBlock {
  codigo: string
  label: string
  icon: string
  descripcion: string
  itemsType?: ItemsType
  itemsLabel?: string
}

export const PREDEFINED_BLOCKS: PredefinedBlock[] = [
  { codigo: 'carrusel', label: 'Carrusel', icon: 'pi pi-images', descripcion: 'Slider de banners principal' },
  { codigo: 'categorias', label: 'Categorías', icon: 'pi pi-th-large', descripcion: 'Cuadrícula de categorías', itemsType: 'categorias', itemsLabel: 'Categorías' },
  { codigo: 'marcas', label: 'Marcas', icon: 'pi pi-tag', descripcion: 'Galería de marcas con logo', itemsType: 'marcas', itemsLabel: 'Marcas' },
  { codigo: 'productos_destacados', label: 'Productos Destacados', icon: 'pi pi-star', descripcion: 'Los productos más populares', itemsType: 'productos', itemsLabel: 'Productos' },
  { codigo: 'listas', label: 'Listas de Productos', icon: 'pi pi-list', descripcion: 'Colecciones personalizadas de productos', itemsType: 'listas', itemsLabel: 'Listas' },
  { codigo: 'gamas', label: 'Gamas', icon: 'pi pi-bars', descripcion: 'Líneas o gamas de productos', itemsType: 'gamas', itemsLabel: 'Gamas' },
  { codigo: 'combos', label: 'Combos', icon: 'pi pi-box', descripcion: 'Combos especiales de productos', itemsType: 'combos', itemsLabel: 'Combos' },
]

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
