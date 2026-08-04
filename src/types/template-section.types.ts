export interface BlockConfig {
  titulo?: string
  bg_color?: string
  /** Cuántos elementos se muestran en la grilla del bloque. En `listas` son los
   *  productos de cada lista (la grilla que ve el comprador). */
  limite?: number
  /** Solo `listas`: cuántas listas renderiza el bloque cuando no se eligieron
   *  listas específicas con `items`. Sin valor, el storefront usa su default. */
  limite_listas?: number
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
  /** Etiqueta del campo `limite`. Nombrar lo que se cuenta evita el malentendido
   *  clásico: en `listas` el límite son productos, no listas. */
  limiteLabel?: string
}

export const PREDEFINED_BLOCKS: PredefinedBlock[] = [
  { codigo: 'carrusel', label: 'Carrusel', icon: 'pi pi-images', descripcion: 'Slider de banners principal', limiteLabel: 'Cantidad de banners' },
  { codigo: 'categorias', label: 'Categorías', icon: 'pi pi-th-large', descripcion: 'Cuadrícula de categorías', itemsType: 'categorias', itemsLabel: 'Categorías', limiteLabel: 'Cantidad de categorías' },
  { codigo: 'marcas', label: 'Marcas', icon: 'pi pi-tag', descripcion: 'Galería de marcas con logo', itemsType: 'marcas', itemsLabel: 'Marcas', limiteLabel: 'Cantidad de marcas' },
  { codigo: 'productos_destacados', label: 'Productos Destacados', icon: 'pi pi-star', descripcion: 'Los productos más populares (automático)', limiteLabel: 'Cantidad de productos' },
  { codigo: 'listas', label: 'Lista de Productos', icon: 'pi pi-list', descripcion: 'Selecciona una lista curada — puedes agregar varias', itemsType: 'listas', itemsLabel: 'Listas de Productos', limiteLabel: 'Productos por lista' },
  // `gamas` se retiró: el storefront no tiene componente para ese código, así que
  // la columna quedaba en blanco. Reincorporarlo exige primero su renderer.
  { codigo: 'combos', label: 'Combos', icon: 'pi pi-box', descripcion: 'Combos especiales de productos', itemsType: 'combos', itemsLabel: 'Combos', limiteLabel: 'Cantidad de combos' },
]

/**
 * Modo del Home. Determina si el storefront arma la portada por su cuenta o si
 * la plantilla del comerciante es la portada completa.
 */
export type HomeModo = 'auto' | 'catalogo' | 'plantilla'

export interface HomeModeDefinition {
  value: HomeModo
  label: string
  icon: string
  descripcion: string
}

export const HOME_MODES: HomeModeDefinition[] = [
  {
    value: 'catalogo',
    label: 'Carrusel + catálogo',
    icon: 'pi pi-images',
    descripcion: 'El home clásico: tu carrusel y, debajo, todo tu catálogo de productos paginado. Nada más. Puedes agregar bloques HTML arriba o abajo.',
  },
  {
    value: 'auto',
    label: 'Home completo',
    icon: 'pi pi-bolt',
    descripcion: 'Además del carrusel, el home arma solo tus categorías, marcas, listas de productos y destacados. Puedes agregar bloques HTML arriba o abajo.',
  },
  {
    value: 'plantilla',
    label: 'Home a medida',
    icon: 'pi pi-th-large',
    descripcion: 'Tú defines el home completo con bloques. El carrusel y el catálogo solo aparecen si los agregas.',
  },
]

/** Bloques que arma el storefront solo, en orden, según el modo. */
export const HOME_AUTO_BLOCKS: Record<'auto' | 'catalogo', { codigo: string; label: string; icon: string }[]> = {
  catalogo: [
    { codigo: 'carrusel', label: 'Carrusel', icon: 'pi pi-images' },
    { codigo: 'catalogo', label: 'Catálogo de productos (paginado)', icon: 'pi pi-shopping-bag' },
  ],
  auto: [
    { codigo: 'carrusel', label: 'Carrusel', icon: 'pi pi-images' },
    { codigo: 'categorias', label: 'Categorías', icon: 'pi pi-th-large' },
    { codigo: 'marcas', label: 'Marcas', icon: 'pi pi-tag' },
    { codigo: 'listas', label: 'Listas de productos', icon: 'pi pi-list' },
    { codigo: 'productos_destacados', label: 'Productos destacados', icon: 'pi pi-star' },
  ],
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
  // El Home expone `footer` solo para el modo automático: ahí los bloques HTML
  // del comerciante se pintan debajo del catálogo. En modo `plantilla` el
  // storefront lee únicamente `header`.
  { id: 1, label: 'Home', zones: ['header', 'footer'] },
  { id: 2, label: 'Catálogo', zones: ['header', 'footer'] },
  { id: 3, label: 'Detalle Producto', zones: ['header', 'footer'] },
  { id: 4, label: 'Carrito', zones: ['header', 'footer'] },
  { id: 5, label: 'Checkout', zones: ['header', 'footer'] },
  { id: 6, label: 'Pago Confirmado', zones: ['header', 'footer'] },
]

export interface ColumnLayout {
  key: string
  label: string
  colBs: number[] // ancho bootstrap (base 12) por columna; la suma debe ser 12
}

// `colBs` define el ancho de cada columna (sistema bootstrap base 12). El
// storefront usa estos valores para construir el grid-template-columns, así que
// soporta proporciones asimétricas además de las divisiones iguales.
export const COLUMN_LAYOUTS: ColumnLayout[] = [
  { key: '1', label: '1 columna', colBs: [12] },
  { key: '2', label: '2 columnas', colBs: [6, 6] },
  { key: '2-1', label: '2 : 1', colBs: [8, 4] },
  { key: '1-2', label: '1 : 2', colBs: [4, 8] },
  { key: '3-1', label: '3 : 1', colBs: [9, 3] },
  { key: '1-3', label: '1 : 3', colBs: [3, 9] },
  { key: '3', label: '3 columnas', colBs: [4, 4, 4] },
  { key: '4', label: '4 columnas', colBs: [3, 3, 3, 3] },
]

export const ZONE_LABELS: Record<'header' | 'footer', string> = {
  header: 'Arriba del contenido',
  footer: 'Abajo del contenido',
}
