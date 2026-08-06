import type { PublishedFilter } from '@/types/product.types'

/**
 * Opciones del filtro por estado de publicación usado en los módulos de
 * gestión masiva (Precios, Stock y Orden del Catálogo).
 *
 * `''` = sin filtro: se listan publicados y no publicados. En los tres casos
 * los productos eliminados (producto_status = 0) quedan siempre fuera.
 */
export const publishedFilterOptions: Array<{
  label: string
  value: PublishedFilter
}> = [
  { label: 'Todos', value: '' },
  { label: 'Solo publicados', value: '1' },
  { label: 'Solo no publicados', value: '0' },
]
