// Per-section color interfaces (each section has different fields)

export interface HeaderColors {
  background: string
  text: string
  accent: string
}

export interface NavbarColors {
  background: string
  links: string
  activeLink: string
}

export interface BodyColors {
  background: string
  titles: string
  text: string
  links: string
  buttonBg: string
  buttonText: string
}

export interface FooterColors {
  background: string
  titles: string
  text: string
  links: string
}

export interface StoreColorConfig {
  header: HeaderColors
  navbar: NavbarColors
  body: BodyColors
  footer: FooterColors
}

// Section metadata for rendering the editor dynamically

export interface ColorFieldDef {
  key: string
  label: string
}

export interface ColorSectionDef {
  id: 'header' | 'navbar' | 'body' | 'footer'
  title: string
  icon: string
  fields: ColorFieldDef[]
}

// Preset types

export interface ColorPreset {
  id: string
  name: string
  category: PresetCategory
  colors: StoreColorConfig
}

export type PresetCategory = 'all' | 'minimalist' | 'bold' | 'pastel' | 'dark' | 'luxury'

export interface PresetCategoryOption {
  id: PresetCategory
  label: string
}

// Default color values

export const DEFAULT_COLORS: StoreColorConfig = {
  header: {
    background: '#FFFFFF',
    text: '#111618',
    accent: '#13A4EC',
  },
  navbar: {
    background: '#1F2937',
    links: '#E5E7EB',
    activeLink: '#FFFFFF',
  },
  body: {
    background: '#F6F7F8',
    titles: '#111618',
    text: '#4B5563',
    links: '#13A4EC',
    buttonBg: '#13A4EC',
    buttonText: '#FFFFFF',
  },
  footer: {
    background: '#1F2937',
    titles: '#FFFFFF',
    text: '#9CA3AF',
    links: '#9CA3AF',
  },
}

// Section definitions (drives editor UI rendering)

export const COLOR_SECTIONS: ColorSectionDef[] = [
  {
    id: 'header',
    title: 'Encabezado',
    icon: 'pi pi-window-maximize',
    fields: [
      { key: 'background', label: 'Fondo' },
      { key: 'text', label: 'Texto' },
      { key: 'accent', label: 'Acento / Iconos' },
    ],
  },
  {
    id: 'navbar',
    title: 'Barra de Navegación',
    icon: 'pi pi-bars',
    fields: [
      { key: 'background', label: 'Fondo' },
      { key: 'links', label: 'Enlaces' },
      { key: 'activeLink', label: 'Enlace Activo' },
    ],
  },
  {
    id: 'body',
    title: 'Contenido',
    icon: 'pi pi-file',
    fields: [
      { key: 'background', label: 'Fondo' },
      { key: 'titles', label: 'Títulos' },
      { key: 'text', label: 'Texto / Párrafos' },
      { key: 'links', label: 'Enlaces' },
      { key: 'buttonBg', label: 'Botones (fondo)' },
      { key: 'buttonText', label: 'Botones (texto)' },
    ],
  },
  {
    id: 'footer',
    title: 'Pie de Página',
    icon: 'pi pi-window-minimize',
    fields: [
      { key: 'background', label: 'Fondo' },
      { key: 'titles', label: 'Títulos' },
      { key: 'text', label: 'Texto' },
      { key: 'links', label: 'Enlaces' },
    ],
  },
]

export const PRESET_CATEGORIES: PresetCategoryOption[] = [
  { id: 'all', label: 'Todos' },
  { id: 'minimalist', label: 'Minimalista' },
  { id: 'bold', label: 'Vibrante' },
  { id: 'pastel', label: 'Pastel' },
  { id: 'dark', label: 'Modo Oscuro' },
  { id: 'luxury', label: 'Lujo' },
]

// ── Typography Types ──

export interface SectionTypography {
  headingFont: string
  bodyFont: string
}

export interface StoreTypographyConfig {
  header: SectionTypography
  navbar: SectionTypography
  body: SectionTypography
  footer: SectionTypography
  scale: number
}

export type FontCategory = 'sans-serif' | 'serif' | 'display' | 'handwriting' | 'monospace'

export interface FontDef {
  family: string
  category: FontCategory
  weights: number[]
}

export interface FontPreset {
  id: string
  name: string
  description: string
  headingFont: string
  bodyFont: string
}

export const DEFAULT_TYPOGRAPHY: StoreTypographyConfig = {
  header: { headingFont: 'Inter', bodyFont: 'Inter' },
  navbar: { headingFont: 'Inter', bodyFont: 'Inter' },
  body: { headingFont: 'Inter', bodyFont: 'Inter' },
  footer: { headingFont: 'Inter', bodyFont: 'Inter' },
  scale: 1.0,
}

export const TYPOGRAPHY_SECTIONS: { id: keyof Omit<StoreTypographyConfig, 'scale'>; title: string; icon: string }[] = [
  { id: 'header', title: 'Encabezado', icon: 'pi pi-window-maximize' },
  { id: 'navbar', title: 'Barra de Navegación', icon: 'pi pi-bars' },
  { id: 'body', title: 'Contenido', icon: 'pi pi-file' },
  { id: 'footer', title: 'Pie de Página', icon: 'pi pi-window-minimize' },
]

// ── Branding / Config Types ──

export interface BrandingConfig {
  logo_url: string | null
  logo_mobile_url: string | null
  logo_email_url: string | null
  favicon_url: string | null
}

// ── Catalog Preferences Types ──

export interface CatalogPreferences {
  desktop_columns: number
  mobile_columns: number
  logo_position: number
  cart_icon: number
  product_order: number
  hide_out_of_stock: number
  pricing_mode: number // 0 = con IGV (default), 1 = sin IGV
  layout_width: number // 0 = contained (1280px), 1 = fluid (100%)
  pdp_layout: number // qué se fija: 0 = la info (default), 1 = las fotos, 2 = nada
  pdp_description: number // 0 = bajo las fotos (default), 1 = bajo la info
  pdp_gallery: number // 0 = miniaturas (default), 1 = apilada, 2 = mosaico
  pdp_recommended_count: number // cuantos productos muestra "Tambien te puede interesar" (0 = ocultar)
  pdp_recommended_source: number // de donde salen: ver PDP_RECOMMENDED_SOURCE
  pdp_recommended_list_id: number | null // solo con source = lista fija
  pdp_recently_viewed_count: number // cuantos productos muestra "Vistos recientemente" (0 = ocultar)
}

export const DEFAULT_CATALOG_PREFERENCES: CatalogPreferences = {
  desktop_columns: 4,
  mobile_columns: 2,
  logo_position: 0,
  cart_icon: 0,
  product_order: 1,
  hide_out_of_stock: 1,
  pricing_mode: 0,
  layout_width: 0,
  pdp_layout: 0,
  pdp_description: 0,
  pdp_gallery: 0,
  pdp_recommended_count: 12,
  pdp_recommended_source: 0,
  pdp_recommended_list_id: null,
  pdp_recently_viewed_count: 6,
}

export interface LayoutWidthOption {
  value: number
  label: string
  description: string
  icon: string
}

export const LAYOUT_WIDTH_OPTIONS: LayoutWidthOption[] = [
  { value: 0, label: 'Contenido', description: 'Ancho máximo de 1280px', icon: 'pi pi-align-center' },
  { value: 1, label: 'Fluido', description: 'Ocupa el 100% del ancho', icon: 'pi pi-arrows-h' },
]

export interface PdpLayoutOption {
  value: number
  label: string
  description: string
  icon: string
}

// Ficha de producto en escritorio, eje 1: qué columna se queda fija al scroll.
export const PDP_LAYOUT_OPTIONS: PdpLayoutOption[] = [
  {
    value: 0,
    label: 'La info',
    description: 'Precio y botón acompañan el scroll',
    icon: 'pi pi-align-right',
  },
  {
    value: 1,
    label: 'Las fotos',
    description: 'La galería acompaña el scroll',
    icon: 'pi pi-align-left',
  },
  {
    value: 2,
    label: 'Nada',
    description: 'Las dos columnas hacen scroll',
    icon: 'pi pi-arrows-v',
  },
]

export interface PdpDescriptionOption {
  value: number
  label: string
  description: string
  icon: string
}

// Eje 2: en qué columna cae la descripción.
export const PDP_DESCRIPTION_OPTIONS: PdpDescriptionOption[] = [
  {
    value: 0,
    label: 'Bajo las fotos',
    description: 'Columna izquierda',
    icon: 'pi pi-image',
  },
  {
    value: 1,
    label: 'Bajo la info',
    description: 'Columna derecha, tras el precio',
    icon: 'pi pi-tag',
  },
]

export interface PdpGalleryOption {
  value: number
  label: string
  description: string
  icon: string
}

// Galería de la ficha: tira de miniaturas o todas las fotos en grande.
export const PDP_GALLERY_OPTIONS: PdpGalleryOption[] = [
  {
    value: 0,
    label: 'Con miniaturas',
    description: 'Una foto grande y el resto en miniatura',
    icon: 'pi pi-images',
  },
  {
    value: 1,
    label: 'Apilada',
    description: 'Todas las fotos en grande, una debajo de otra',
    icon: 'pi pi-clone',
  },
  {
    value: 2,
    label: 'En mosaico',
    description: 'Todas las fotos en grande, en dos columnas',
    icon: 'pi pi-th-large',
  },
]

// ── Productos recomendados del PDP ("Tambien te puede interesar") ──

export const PDP_RECOMMENDED_SOURCE = {
  AUTO: 0,
  CATEGORY: 1,
  BRAND: 2,
  GAMMA: 3,
  LIST: 4,
} as const

export interface PdpRecommendedCountOption {
  value: number
  label: string
  description: string
}

// La ficha dibuja estas vitrinas en una grilla de 6 columnas en escritorio
// (2 en movil), asi que 6 es una fila justa y 12 son dos.
export const PDP_RECOMMENDED_COUNT_OPTIONS: PdpRecommendedCountOption[] = [
  { value: 0, label: 'Ninguno', description: 'Oculta el bloque' },
  { value: 4, label: '4', description: 'Fila corta' },
  { value: 6, label: '6', description: 'Una fila' },
  { value: 8, label: '8', description: 'Fila y media' },
  { value: 12, label: '12', description: 'Dos filas' },
]

// "Vistos recientemente" comparte la grilla con el bloque de arriba, asi que
// tambien comparte las opciones: emparejar las dos cantidades es justo para lo
// que sirve esto.
export const PDP_RECENTLY_VIEWED_COUNT_OPTIONS: PdpRecommendedCountOption[] =
  PDP_RECOMMENDED_COUNT_OPTIONS

export interface PdpRecommendedSourceOption {
  value: number
  label: string
  description: string
  icon: string
}

export const PDP_RECOMMENDED_SOURCE_OPTIONS: PdpRecommendedSourceOption[] = [
  {
    value: PDP_RECOMMENDED_SOURCE.AUTO,
    label: 'Automatico',
    description: 'Mezcla categoria, marca, precio y lo que suelen comprar juntos',
    icon: 'pi pi-sparkles',
  },
  {
    value: PDP_RECOMMENDED_SOURCE.CATEGORY,
    label: 'Misma categoria',
    description: 'Solo productos que comparten categoria',
    icon: 'pi pi-sitemap',
  },
  {
    value: PDP_RECOMMENDED_SOURCE.BRAND,
    label: 'Misma marca',
    description: 'Solo productos de la misma marca',
    icon: 'pi pi-tag',
  },
  {
    value: PDP_RECOMMENDED_SOURCE.GAMMA,
    label: 'Misma gama',
    description: 'Solo productos de la misma gama',
    icon: 'pi pi-tags',
  },
  {
    value: PDP_RECOMMENDED_SOURCE.LIST,
    label: 'Una lista fija',
    description: 'La misma vitrina en todas las fichas',
    icon: 'pi pi-list',
  },
]

export interface PricingModeOption {
  value: number
  label: string
  description: string
  icon: string
}

export const PRICING_MODE_OPTIONS: PricingModeOption[] = [
  {
    value: 0,
    label: 'Con IGV incluido',
    description: 'Ingresas el precio final (recomendado)',
    icon: 'pi pi-wallet',
  },
  {
    value: 1,
    label: 'Sin IGV (base imponible)',
    description: 'Ingresas el precio sin impuestos',
    icon: 'pi pi-calculator',
  },
]

export interface CatalogOption {
  value: number
  label: string
}

export interface CartIconOption {
  value: number
  label: string
  icon: string
}

export const DESKTOP_COLUMN_OPTIONS: CatalogOption[] = [
  { value: 3, label: '3 columnas' },
  { value: 4, label: '4 columnas' },
  { value: 6, label: '6 columnas' },
]

export const MOBILE_COLUMN_OPTIONS: CatalogOption[] = [
  { value: 1, label: '1 columna' },
  { value: 2, label: '2 columnas' },
]

export interface LogoPositionOption {
  value: number
  label: string
  icon: string
}

export const LOGO_POSITION_OPTIONS: LogoPositionOption[] = [
  { value: 2, label: 'Izquierda', icon: 'pi pi-align-left' },
  { value: 0, label: 'Centro', icon: 'pi pi-align-center' },
]

export const CART_ICON_OPTIONS: CartIconOption[] = [
  { value: 0, label: 'Carrito', icon: 'pi pi-shopping-cart' },
  { value: 1, label: 'Canasta', icon: 'basket' },
  { value: 2, label: 'Bolsa', icon: 'pi pi-shopping-bag' },
]

export interface ProductOrderOption {
  value: number
  label: string
  description: string
  icon: string
}

export const PRODUCT_ORDER_OPTIONS: ProductOrderOption[] = [
  { value: 1, label: 'Alfabetico', description: 'Nombre A-Z', icon: 'pi pi-sort-alpha-down' },
  {
    value: 5,
    label: 'Categoria y Subcategoria',
    description: 'Agrupados por categoria',
    icon: 'pi pi-sitemap',
  },
  {
    value: 4,
    label: 'Mas nuevo',
    description: 'Mas recientes primero',
    icon: 'pi pi-calendar',
  },
  {
    value: 6,
    label: 'Orden manual',
    description: 'Orden personalizado',
    icon: 'pi pi-arrows-v',
  },
  {
    value: 2,
    label: 'Precio menor',
    description: 'De menor a mayor',
    icon: 'pi pi-sort-amount-up',
  },
  {
    value: 3,
    label: 'Precio mayor',
    description: 'De mayor a menor',
    icon: 'pi pi-sort-amount-down',
  },
  {
    value: 7,
    label: 'Marcas y Gammas',
    description: 'Agrupados por marca y gama',
    icon: 'pi pi-tags',
  },
]
