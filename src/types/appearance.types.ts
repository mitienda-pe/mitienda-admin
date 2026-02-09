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
  favicon_url: string | null
}

// ── Catalog Preferences Types ──

export interface CatalogPreferences {
  desktop_columns: number
  mobile_columns: number
  cart_icon: number
}

export const DEFAULT_CATALOG_PREFERENCES: CatalogPreferences = {
  desktop_columns: 4,
  mobile_columns: 2,
  cart_icon: 0,
}

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

export const CART_ICON_OPTIONS: CartIconOption[] = [
  { value: 0, label: 'Carrito', icon: 'pi pi-shopping-cart' },
  { value: 1, label: 'Canasta', icon: 'basket' },
  { value: 2, label: 'Bolsa', icon: 'pi pi-shopping-bag' },
]
