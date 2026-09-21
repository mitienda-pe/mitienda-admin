export type MenuLinkType =
  | 'categoria'
  | 'subcategoria'
  | 'producto'
  | 'marca'
  | 'gamma'
  | 'lista'
  | 'pagina'
  | 'bloglistado'
  | 'blogcategoria'
  | 'blog'
  | 'url'

/**
 * Tipos que no apuntan a una entidad elegible: el destino es fijo y la URL se
 * rellena sola. La API exige `url`, así que se guarda igual.
 */
export const MENU_LINK_FIXED_URLS: Partial<Record<MenuLinkType, string>> = {
  bloglistado: 'blog'
}

export interface MenuItem {
  id: number
  label: string
  url: string
  type: MenuLinkType
  targetBlank: boolean
  order: number
  parentId: number
  children?: MenuItem[]
}

export interface Menu {
  id: number
  name: string
  type: string
  items: MenuItem[]
}

export interface MenuItemForm {
  label: string
  type: MenuLinkType
  url: string
  parentId: number
  targetBlank: boolean
}

export interface LinkOption {
  id: number | string
  label: string
  slug?: string
  parentSlug?: string
}

export interface LinkOptionGroup {
  parent: LinkOption
  children: LinkOption[]
}

export const MENU_LINK_TYPE_LABELS: Record<MenuLinkType, string> = {
  categoria: 'Categoría',
  subcategoria: 'Subcategoría',
  producto: 'Producto',
  marca: 'Marca',
  gamma: 'Gamma',
  lista: 'Lista',
  pagina: 'Página',
  bloglistado: 'Blog (todas las entradas)',
  blogcategoria: 'Categoría Blog',
  blog: 'Entrada Blog',
  url: 'URL Externa'
}

export const MENU_LINK_TYPE_OPTIONS: { label: string; value: MenuLinkType }[] = [
  { label: 'Categoría', value: 'categoria' },
  { label: 'Subcategoría', value: 'subcategoria' },
  { label: 'Producto', value: 'producto' },
  { label: 'Marca', value: 'marca' },
  { label: 'Gamma', value: 'gamma' },
  { label: 'Lista', value: 'lista' },
  { label: 'Página', value: 'pagina' },
  { label: 'Blog (todas las entradas)', value: 'bloglistado' },
  { label: 'Categoría Blog', value: 'blogcategoria' },
  { label: 'Entrada Blog', value: 'blog' },
  { label: 'URL Externa', value: 'url' }
]
